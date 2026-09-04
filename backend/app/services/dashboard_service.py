from typing import List
from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import (
    ChannelPerformanceItem,
    DashboardKPIs,
    DashboardResponse,
    FailureReasonItem,
    FunnelStageItem,
    RiskDistributionItem,
    TrendDataPoint,
)


class DashboardService:
    @staticmethod
    async def get_dashboard_data(db: AsyncSession) -> DashboardResponse:
        # 1. KPI Aggregations
        kpi_query = text("""
            SELECT 
                COALESCE(SUM(amount), 0) as total_at_risk,
                COALESCE(SUM(amount) FILTER (WHERE status = 'recovered'), 0) as total_recovered,
                COALESCE(SUM(amount) FILTER (WHERE status = 'lost'), 0) as total_lost,
                COALESCE(SUM(amount) FILTER (WHERE status NOT IN ('recovered', 'lost')), 0) as in_flight_risk,
                COUNT(*) as total_cases,
                COUNT(*) FILTER (WHERE status = 'recovered') as recovered_cases,
                COUNT(*) FILTER (WHERE status = 'lost') as lost_cases,
                COUNT(*) FILTER (WHERE status NOT IN ('recovered', 'lost')) as active_cases,
                COALESCE(AVG(recovery_probability), 0) as avg_probability
            FROM recovery_cases;
        """)
        kpi_res = (await db.execute(kpi_query)).fetchone()

        total_at_risk = float(kpi_res[0])
        total_recovered = float(kpi_res[1])
        total_lost = float(kpi_res[2])
        in_flight_risk = float(kpi_res[3])
        total_cases = int(kpi_res[4])
        recovered_cases = int(kpi_res[5])
        lost_cases = int(kpi_res[6])
        active_cases = int(kpi_res[7])
        avg_prob = round(float(kpi_res[8]), 3)

        resolved_amount = total_recovered + total_lost
        financial_recovery_rate = (
            round((total_recovered / resolved_amount) * 100.0, 1)
            if resolved_amount > 0
            else 0.0
        )

        resolved_cases = recovered_cases + lost_cases
        case_recovery_rate = (
            round((recovered_cases / resolved_cases) * 100.0, 1)
            if resolved_cases > 0
            else 0.0
        )

        # Estimated ROI: Net recovered vs assumed recovery outreach operational cost (~2.5%)
        assumed_cost = total_at_risk * 0.025
        estimated_roi = round(total_recovered / max(assumed_cost, 1.0), 1)
        churn_res = await db.execute(text("SELECT COALESCE(AVG(churn_risk_score), 0) FROM customer_sentiment"))
        recovered_today_res = await db.execute(text("SELECT COALESCE(SUM(amount), 0) FROM recovery_cases WHERE status = 'recovered' AND recovered_at >= date_trunc('day', now())"))
        avg_churn_risk = round(float(churn_res.scalar() or 0), 3)
        revenue_recovered_today = round(float(recovered_today_res.scalar() or 0), 2)
        # Recommendation accuracy: share of recovered cases whose assigned channel
        # matched the latest stored recommendation (durable attribution signal).
        try:
            reco_acc_res = await db.execute(text("""
                SELECT ROUND(
                  COUNT(*) FILTER (
                    WHERE rc.status = 'recovered'
                      AND r.recommended_channel IS NOT DISTINCT FROM rc.assigned_channel
                  ) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE rc.status = 'recovered'), 0), 1)
                FROM recovery_cases rc
                LEFT JOIN LATERAL (
                  SELECT recommended_channel FROM recommendations
                  WHERE recommendations.case_id = rc.id
                  ORDER BY created_at DESC LIMIT 1
                ) r ON true
            """))
            reco_accuracy = float(reco_acc_res.scalar() or 0.0)
        except Exception:
            reco_accuracy = 0.0
        # Payment reconciliation totals (verifiable Razorpay attempts)
        try:
            recon_res = await db.execute(text("""
                SELECT COUNT(*), COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0)
                FROM payment_attempts
            """))
            recon_row = recon_res.fetchone()
            recon_count, recon_paid = int(recon_row[0] or 0), round(float(recon_row[1] or 0), 2)
        except Exception:
            recon_count, recon_paid = 0, 0.0

        kpis = DashboardKPIs(
            total_revenue_at_risk=total_at_risk,
            total_revenue_recovered=total_recovered,
            total_revenue_lost=total_lost,
            active_in_flight_risk=in_flight_risk,
            financial_recovery_rate_pct=financial_recovery_rate,
            total_cases_count=total_cases,
            active_cases_count=active_cases,
            recovered_cases_count=recovered_cases,
            lost_cases_count=lost_cases,
            case_recovery_rate_pct=case_recovery_rate,
            avg_recovery_probability=avg_prob,
            estimated_roi_multiplier=estimated_roi,
            avg_churn_risk=avg_churn_risk,
            revenue_recovered_today=revenue_recovered_today,
            ai_recommendation_accuracy_pct=reco_accuracy,
        )

        # 2. Recovery Trend Data (Daily aggregation over past 30 days)
        trend_query = text("""
            SELECT 
                TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as day,
                COALESCE(SUM(amount) FILTER (WHERE status = 'recovered'), 0) as recovered,
                COALESCE(SUM(amount) FILTER (WHERE status = 'lost'), 0) as lost,
                COALESCE(SUM(amount), 0) as total
            FROM recovery_cases
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', created_at)
            ORDER BY DATE_TRUNC('day', created_at) ASC;
        """)
        trend_res = (await db.execute(trend_query)).fetchall()
        recovery_trend = [
            TrendDataPoint(
                date=r[0],
                recovered_amount=round(float(r[1]), 2),
                lost_amount=round(float(r[2]), 2),
                at_risk_amount=round(float(r[3]), 2),
            )
            for r in trend_res
        ]

        # 3. Failure Reasons Breakdown
        reasons_query = text("""
            SELECT 
                COALESCE(failure_reason, 'other') as reason,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as amount,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
            FROM payments
            WHERE status IN ('failed', 'abandoned', 'overdue')
            GROUP BY failure_reason
            ORDER BY count DESC;
        """)
        reasons_res = (await db.execute(reasons_query)).fetchall()
        failure_reasons = [
            FailureReasonItem(
                reason=r[0].replace("_", " ").title(),
                count=int(r[1]),
                amount=round(float(r[2]), 2),
                percentage=float(r[3]),
            )
            for r in reasons_res
        ]

        # 4. Channel Performance
        channel_query = text("""
            SELECT 
                COALESCE(assigned_channel, 'unassigned') as channel,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'recovered') as recovered,
                ROUND(COUNT(*) FILTER (WHERE status = 'recovered') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('recovered', 'lost')), 0), 1) as win_rate,
                COALESCE(SUM(amount) FILTER (WHERE status = 'recovered'), 0) as rec_amount
            FROM recovery_cases
            GROUP BY assigned_channel
            ORDER BY total DESC;
        """)
        channel_res = (await db.execute(channel_query)).fetchall()
        channel_performance = [
            ChannelPerformanceItem(
                channel=r[0].replace("_", " ").title(),
                total_cases=int(r[1]),
                recovered_cases=int(r[2]),
                win_rate_pct=float(r[3] or 0.0),
                recovered_amount=round(float(r[4]), 2),
            )
            for r in channel_res
        ]

        # 5. Risk Tier Distribution
        risk_query = text("""
            SELECT 
                COALESCE(risk_level, 'unknown') as risk,
                COUNT(*) as count,
                COALESCE(AVG(recovery_probability), 0) as avg_prob,
                ROUND(COUNT(*) FILTER (WHERE status = 'recovered') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('recovered', 'lost')), 0), 1) as win_rate
            FROM recovery_cases
            GROUP BY risk_level
            ORDER BY 
                CASE risk_level 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                    ELSE 4 
                END;
        """)
        risk_res = (await db.execute(risk_query)).fetchall()
        risk_distribution = [
            RiskDistributionItem(
                risk_level=r[0].title(),
                count=int(r[1]),
                avg_probability=round(float(r[2]), 3),
                recovery_rate_pct=float(r[3] or 0.0),
            )
            for r in risk_res
        ]

        # 6. Recovery Funnel
        funnel_query = text("""
            SELECT 
                COUNT(*) as detected,
                COUNT(*) FILTER (WHERE status IN ('contacted', 'link_opened', 'payment_attempted', 'recovered')) as contacted,
                COUNT(*) FILTER (WHERE status IN ('link_opened', 'payment_attempted', 'recovered')) as link_opened,
                COUNT(*) FILTER (WHERE status IN ('payment_attempted', 'recovered')) as payment_attempted,
                COUNT(*) FILTER (WHERE status = 'recovered') as recovered
            FROM recovery_cases;
        """)
        funnel_res = (await db.execute(funnel_query)).fetchone()
        tot_detected = max(int(funnel_res[0]), 1)
        funnel_stages = [
            ("Leakage Detected", int(funnel_res[0])),
            ("Outreach Contacted", int(funnel_res[1])),
            ("Payment Link Opened", int(funnel_res[2])),
            ("Payment Attempted", int(funnel_res[3])),
            ("Revenue Recovered", int(funnel_res[4])),
        ]
        recovery_funnel = [
            FunnelStageItem(
                stage=s[0],
                count=s[1],
                percentage=round((s[1] / tot_detected) * 100.0, 1),
            )
            for s in funnel_stages
        ]

        return DashboardResponse(
            kpis=kpis,
            recovery_trend=recovery_trend,
            failure_reasons=failure_reasons,
            channel_performance=channel_performance,
            risk_distribution=risk_distribution,
            recovery_funnel=recovery_funnel,
        )
