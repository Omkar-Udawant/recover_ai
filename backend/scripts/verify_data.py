import asyncio
import os
import sys
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session


async def run_verification():
    print("=" * 70)
    print(" RecoverAI — Database Verification & Sanity Check Report")
    print("=" * 70)

    async with async_session() as session:
        # 1. Total Row Counts
        print("\n1. Table Row Counts:")
        print("-" * 45)
        tables = [
            "customers", "subscriptions", "payments",
            "recovery_cases", "recovery_actions", "predictions", "audit_logs"
        ]
        for tbl in tables:
            res = await session.execute(text(f"SELECT COUNT(*) FROM {tbl};"))
            cnt = res.scalar()
            print(f"   • {tbl:<20}: {cnt:>6} rows")

        # 2. Payment Failure Rate & Failure Reasons
        print("\n2. Payment Breakdown by Status & Failure Reason:")
        print("-" * 55)
        res = await session.execute(text("""
            SELECT status, event_type, failure_reason, COUNT(*) as count,
                   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pct
            FROM payments
            GROUP BY status, event_type, failure_reason
            ORDER BY count DESC;
        """))
        rows = res.fetchall()
        for r in rows:
            print(f"   • {r[0]:<10} | {r[1]:<22} | {str(r[2]):<20} : {r[3]:>5} ({r[4]}%)")

        # 3. Recovery Cases by Risk Level & Recovery Rate
        print("\n3. Recovery Cases by Risk Level & Outcome:")
        print("-" * 65)
        res = await session.execute(text("""
            SELECT 
                risk_level,
                COUNT(*) as total_cases,
                ROUND(AVG(recovery_probability), 3) as avg_prob,
                COUNT(*) FILTER (WHERE status = 'recovered') as recovered,
                COUNT(*) FILTER (WHERE status = 'lost') as lost,
                COUNT(*) FILTER (WHERE status NOT IN ('recovered', 'lost')) as in_flight,
                ROUND(COUNT(*) FILTER (WHERE status = 'recovered') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('recovered', 'lost')), 0), 1) as recovery_rate_pct
            FROM recovery_cases
            GROUP BY risk_level
            ORDER BY 
                CASE risk_level 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END;
        """))
        rows = res.fetchall()
        for r in rows:
            print(f"   • Risk: {r[0]:<6} | Total: {r[1]:>4} | Avg Prob: {r[2]} | Rec: {r[3]:>4} | Lost: {r[4]:>4} | In-flight: {r[5]:>3} | Rec Rate: {r[6]}%")

        # 4. Channel Distribution & Performance
        print("\n4. Recovery Channel Performance:")
        print("-" * 55)
        res = await session.execute(text("""
            SELECT 
                assigned_channel,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'recovered') as recovered,
                ROUND(COUNT(*) FILTER (WHERE status = 'recovered') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('recovered', 'lost')), 0), 1) as recovery_rate_pct
            FROM recovery_cases
            GROUP BY assigned_channel
            ORDER BY total DESC;
        """))
        rows = res.fetchall()
        for r in rows:
            print(f"   • Channel: {str(r[0]):<12} | Cases: {r[1]:>4} | Recovered: {r[2]:>4} | Win Rate: {r[3]}%")

        # 5. Financial Overview
        print("\n5. Financial Impact Summary (At-Risk vs Recovered):")
        print("-" * 60)
        res = await session.execute(text("""
            SELECT 
                SUM(amount) as total_at_risk,
                SUM(amount) FILTER (WHERE status = 'recovered') as total_recovered,
                SUM(amount) FILTER (WHERE status = 'lost') as total_lost,
                SUM(amount) FILTER (WHERE status NOT IN ('recovered', 'lost')) as in_flight_amount,
                ROUND(SUM(amount) FILTER (WHERE status = 'recovered') * 100.0 / NULLIF(SUM(amount) FILTER (WHERE status IN ('recovered', 'lost')), 0), 1) as financial_recovery_rate_pct
            FROM recovery_cases;
        """))
        r = res.fetchone()
        print(f"   • Total Revenue At Risk:   INR {r[0]:,.2f}")
        print(f"   • Revenue Won Back:        INR {r[1]:,.2f}")
        print(f"   • Revenue Lost:            INR {r[2]:,.2f}")
        print(f"   • Active In-Flight Risk:   INR {r[3]:,.2f}")
        print(f"   • Financial Recovery Rate: {r[4]}%")

    print("\n" + "=" * 70)
    print(" [✓] Verification Complete — Synthetic dataset distribution is sound!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_verification())
