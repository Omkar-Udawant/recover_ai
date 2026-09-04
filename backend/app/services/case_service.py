import math
from typing import List, Optional
import uuid
from sqlalchemy import desc, asc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.models.customer import Customer
from app.models.intelligence import CustomerSentiment, PaymentAttempt, Recommendation
from app.models.payment import Payment
from app.models.prediction import Prediction
from app.models.recovery_action import RecoveryAction
from app.models.recovery_case import RecoveryCase
from app.schemas.cases import (
    AuditLogItem,
    CaseDetailResponse,
    CaseListItem,
    CaseListResponse,
    CustomerSummary,
    PaymentSummary,
    PredictionItem,
    RecoveryActionItem,
)


class CaseService:
    @staticmethod
    async def list_cases(
        db: AsyncSession,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        channel: Optional[str] = None,
        search: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> CaseListResponse:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)

        # Base query joined with Customer and Payment
        query = (
            select(
                RecoveryCase,
                Customer.name.label("customer_name"),
                Customer.email.label("customer_email"),
                Customer.phone.label("customer_phone"),
                Payment.failure_reason.label("failure_reason"),
                Payment.event_type.label("event_type"),
                Payment.days_overdue.label("days_overdue"),
            )
            .outerjoin(Customer, RecoveryCase.customer_id == Customer.id)
            .outerjoin(Payment, RecoveryCase.payment_id == Payment.id)
        )

        # Apply Filters
        if status:
            query = query.where(RecoveryCase.status == status.lower())
        if risk_level:
            query = query.where(RecoveryCase.risk_level == risk_level.lower())
        if channel:
            query = query.where(RecoveryCase.assigned_channel == channel.lower())
        if min_amount is not None:
            query = query.where(RecoveryCase.amount >= min_amount)
        if max_amount is not None:
            query = query.where(RecoveryCase.amount <= max_amount)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    Customer.name.ilike(search_pattern),
                    Customer.email.ilike(search_pattern),
                )
            )

        # Count total matching rows
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Sorting
        sort_column = getattr(RecoveryCase, sort_by, RecoveryCase.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        rows = result.all()

        items = []
        for r in rows:
            case = r[0]
            items.append(
                CaseListItem(
                    id=case.id,
                    customer_id=case.customer_id,
                    customer_name=r[1] or "Unknown",
                    customer_email=r[2] or "unknown@email.com",
                    customer_phone=r[3],
                    payment_id=case.payment_id,
                    amount=float(case.amount or 0.0),
                    currency="INR",
                    status=case.status,
                    risk_level=case.risk_level,
                    recovery_probability=(
                        float(case.recovery_probability)
                        if case.recovery_probability is not None
                        else None
                    ),
                    assigned_channel=case.assigned_channel,
                    failure_reason=r[4],
                    event_type=r[5],
                    days_overdue=r[6] or 0,
                    created_at=case.created_at,
                    recovered_at=case.recovered_at,
                )
            )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return CaseListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_case_detail(
        db: AsyncSession, case_id: uuid.UUID
    ) -> Optional[CaseDetailResponse]:
        # Fetch RecoveryCase with related customer, payment, actions, predictions
        query = (
            select(RecoveryCase)
            .options(
                selectinload(RecoveryCase.customer),
                selectinload(RecoveryCase.payment),
                selectinload(RecoveryCase.recovery_actions),
                selectinload(RecoveryCase.predictions),
            )
            .where(RecoveryCase.id == case_id)
        )
        res = await db.execute(query)
        case = res.scalar_one_or_none()

        if not case:
            return None

        # Fetch audit logs for this case
        audit_query = (
            select(AuditLog)
            .where(AuditLog.entity_id == case_id)
            .order_by(desc(AuditLog.created_at))
        )
        audit_res = await db.execute(audit_query)
        audit_logs = audit_res.scalars().all()

        customer_summary = None
        if case.customer:
            customer_summary = CustomerSummary(
                id=case.customer.id,
                name=case.customer.name,
                email=case.customer.email,
                phone=case.customer.phone,
                tenure_days=case.customer.tenure_days,
                engagement_score=float(case.customer.engagement_score),
                previous_successful_recoveries=case.customer.previous_successful_recoveries,
            )

        payment_summary = None
        if case.payment:
            payment_summary = PaymentSummary(
                id=case.payment.id,
                amount=float(case.payment.amount),
                currency=case.payment.currency,
                status=case.payment.status,
                failure_reason=case.payment.failure_reason,
                event_type=case.payment.event_type,
                days_overdue=case.payment.days_overdue,
                created_at=case.payment.created_at,
            )

        action_items = [
            RecoveryActionItem(
                id=a.id,
                channel=a.channel,
                message_content=a.message_content,
                payment_link=a.payment_link,
                action_status=a.action_status,
                template=a.template,
                lang=a.lang,
                cost_paise=a.cost_paise,
                created_at=a.created_at,
            )
            for a in sorted(case.recovery_actions, key=lambda x: x.created_at, reverse=True)
        ]

        prediction_items = [
            PredictionItem(
                id=p.id,
                model_version=p.model_version,
                features=p.features,
                predicted_probability=(
                    float(p.predicted_probability)
                    if p.predicted_probability is not None
                    else None
                ),
                created_at=p.created_at,
            )
            for p in sorted(case.predictions, key=lambda x: x.created_at, reverse=True)
        ]

        audit_items = [
            AuditLogItem(
                id=al.id,
                actor=al.actor,
                action=al.action,
                entity_type=al.entity_type,
                metadata=al.log_metadata,
                created_at=al.created_at,
            )
            for al in audit_logs
        ]

        # Payment reconciliation (verifiable Razorpay attempts)
        attempt_res = await db.execute(
            select(PaymentAttempt)
            .where(PaymentAttempt.case_id == case_id)
            .order_by(desc(PaymentAttempt.created_at))
        )
        attempts = attempt_res.scalars().all()
        reconciliation = [
            {
                "link_id": a.razorpay_link_id,
                "order_id": a.razorpay_order_id,
                "amount": float(a.amount),
                "currency": a.currency,
                "status": a.payment_status,
                "reference": a.payment_reference,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in attempts
        ]

        # Latest stored sentiment / recommendation (durable intelligence)
        sentiment_res = await db.execute(
            select(CustomerSentiment)
            .where(CustomerSentiment.case_id == case_id)
            .order_by(desc(CustomerSentiment.created_at))
            .limit(1)
        )
        latest_sentiment = sentiment_res.scalar_one_or_none()
        reco_res = await db.execute(
            select(Recommendation)
            .where(Recommendation.case_id == case_id)
            .order_by(desc(Recommendation.created_at))
            .limit(1)
        )
        latest_reco = reco_res.scalar_one_or_none()

        engagement = float(case.customer.engagement_score if case.customer else 0)
        intelligence = {
            "recovery_confidence_score": round(float(case.recovery_probability or 0) * 100, 1),
            "sentiment": latest_sentiment.sentiment if latest_sentiment else ("positive" if engagement >= 65 else "neutral"),
            "sentiment_score": float(latest_sentiment.score) if latest_sentiment else None,
            "churn_risk": "high" if (latest_sentiment and float(latest_sentiment.churn_risk_score) >= 0.7) else ("low" if engagement >= 65 else "medium"),
            "churn_risk_score": float(latest_sentiment.churn_risk_score) if latest_sentiment else None,
            "recommended_channel": latest_reco.recommended_channel if latest_reco else None,
            "recommended_retry_time": latest_reco.recommended_retry_time.isoformat() if latest_reco and latest_reco.recommended_retry_time else None,
            "payment_reconciliation": reconciliation,
            "explanation": [
                f"Historical recovery probability is {float(case.recovery_probability or 0) * 100:.0f}%.",
                f"Customer engagement score is {engagement:.0f}/100.",
                f"Payment is {case.payment.days_overdue if case.payment else 0} days overdue.",
            ],
        }

        return CaseDetailResponse(
            id=case.id,
            amount=float(case.amount or 0.0),
            currency="INR",
            status=case.status,
            risk_level=case.risk_level,
            recovery_probability=(
                float(case.recovery_probability)
                if case.recovery_probability is not None
                else None
            ),
            assigned_channel=case.assigned_channel,
            created_at=case.created_at,
            recovered_at=case.recovered_at,
            customer=customer_summary,
            payment=payment_summary,
            actions=action_items,
            predictions=prediction_items,
            audit_logs=audit_items,
            intelligence=intelligence,
        )
