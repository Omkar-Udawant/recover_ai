import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import recovery_graph
from app.agents.recovery_tracking import persist_recovery_async
from app.agents.state import RecoveryState
from app.api.deps import get_current_user, get_db
from app.models import Customer, Payment, RecoveryCase
from app.schemas.agent import AgentRunRequest, AgentRunResponse
from app.schemas.common import TokenPayload

logger = logging.getLogger("recoverai.agent")

router = APIRouter(prefix="/agent", tags=["Agent Orchestration"])


@router.post("/run", response_model=AgentRunResponse)
async def run_recovery_agent(
    payload: AgentRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Trigger the end-to-end 8-agent LangGraph workflow on a payment or case event:
    1. Risk Detection -> 2. Recovery Prediction -> 3. Sentiment/Churn ->
    4. Recommendation/Timing -> 5. Channel Selection -> 6. Payment Retry ->
    7. Message Generation -> 8. Recovery Tracking
    Never fabricates payment links: payment_link is empty when Razorpay is
    unconfigured/unreachable and the error is surfaced in tracking/audit.
    """
    initial_state: RecoveryState = {
        "payment_id": payload.payment_id or str(uuid.uuid4()),
        "customer_id": payload.customer_id or str(uuid.uuid4()),
        "event_type": "payment_failed",
        "amount": payload.amount or 2499.0,
        "currency": "INR",
        "customer_name": payload.customer_name or "Valued Customer",
        "customer_email": payload.customer_email or "customer@example.com",
        "customer_phone": payload.customer_phone or "+91 9999999999",
        "tenure_days": 120,
        "engagement_score": 65.0,
        "previous_successful_recoveries": 1,
        "days_overdue": 3,
        "failure_reason": "insufficient_funds",
        "tone": payload.tone or "professional",
        "risk_level": None,
        "recovery_probability": None,
        "channel": None,
        "channel_reason": None,
        "message": None,
        "payment_link": None,
        "case_id": payload.case_id,
        "case_status": "pending",
        "error": None,
    }

    # If payment_id is provided, load real records from PostgreSQL
    if payload.payment_id:
        try:
            pid = uuid.UUID(payload.payment_id)
            res = await db.execute(
                select(Payment, Customer)
                .outerjoin(Customer, Payment.customer_id == Customer.id)
                .where(Payment.id == pid)
            )
            row = res.first()
            if row:
                pay, cust = row
                initial_state["payment_id"] = str(pay.id)
                initial_state["amount"] = float(pay.amount)
                initial_state["currency"] = pay.currency
                initial_state["event_type"] = pay.event_type
                initial_state["failure_reason"] = pay.failure_reason or "insufficient_funds"
                initial_state["days_overdue"] = pay.days_overdue

                if cust:
                    initial_state["customer_id"] = str(cust.id)
                    initial_state["customer_name"] = cust.name
                    initial_state["customer_email"] = cust.email
                    initial_state["customer_phone"] = cust.phone
                    initial_state["tenure_days"] = cust.tenure_days
                    initial_state["engagement_score"] = float(cust.engagement_score)
                    initial_state["previous_successful_recoveries"] = cust.previous_successful_recoveries
        except Exception:
            pass

    # If case_id is provided, load real case from PostgreSQL
    if payload.case_id:
        try:
            cid = uuid.UUID(payload.case_id)
            res = await db.execute(
                select(RecoveryCase, Customer, Payment)
                .outerjoin(Customer, RecoveryCase.customer_id == Customer.id)
                .outerjoin(Payment, RecoveryCase.payment_id == Payment.id)
                .where(RecoveryCase.id == cid)
            )
            row = res.first()
            if row:
                rc, cust, pay = row
                initial_state["case_id"] = str(rc.id)
                initial_state["amount"] = float(rc.amount or (pay.amount if pay else 2499.0))
                if pay:
                    initial_state["payment_id"] = str(pay.id)
                    initial_state["currency"] = pay.currency
                    initial_state["event_type"] = pay.event_type
                    initial_state["failure_reason"] = pay.failure_reason or "insufficient_funds"
                    initial_state["days_overdue"] = pay.days_overdue
                if cust:
                    initial_state["customer_id"] = str(cust.id)
                    initial_state["customer_name"] = cust.name
                    initial_state["customer_email"] = cust.email
                    initial_state["customer_phone"] = cust.phone
                    initial_state["tenure_days"] = cust.tenure_days
                    initial_state["engagement_score"] = float(cust.engagement_score)
                    initial_state["previous_successful_recoveries"] = cust.previous_successful_recoveries
        except Exception:
            pass

    # Execute LangGraph Pipeline (pure state transitions; no I/O side effects)
    final_state = recovery_graph.invoke(initial_state)

    # Persist the outcome in the request transaction (single commit).
    try:
        await persist_recovery_async(db, final_state)
        await db.commit()
    except Exception:
        logger.exception("Recovery persistence failed")
        await db.rollback()
        final_state["error"] = f"persistence_failed:{final_state.get('error') or 'see server logs'}"

    return AgentRunResponse(
        case_id=final_state.get("case_id") or str(uuid.uuid4()),
        payment_id=final_state.get("payment_id") or str(uuid.uuid4()),
        risk_level=final_state.get("risk_level") or "medium",
        recovery_probability=float(final_state.get("recovery_probability") or 0.5),
        channel=final_state.get("channel") or "email",
        channel_reason=final_state.get("channel_reason") or "Selected based on risk and value.",
        message=final_state.get("message") or "Payment update required.",
        payment_link=final_state.get("payment_link") or "",
        case_status=final_state.get("case_status") or "contacted",
    )
