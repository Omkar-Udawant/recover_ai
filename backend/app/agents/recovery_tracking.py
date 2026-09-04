import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.state import RecoveryState
from app.models import AuditLog, Prediction, RecoveryAction, RecoveryCase
from app.models.intelligence import AgentExecution, CustomerSentiment, PaymentAttempt, Recommendation


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 8 — Recovery Tracking (graph node, pure state transition).

    Database persistence intentionally lives in the API layer
    (persist_recovery_async, called with the request-scoped session) so the
    graph never juggles its own engines, threads, or event loops.
    """
    if not state.get("case_id"):
        state["case_id"] = str(uuid.uuid4())
    state["case_status"] = "contacted"
    return state


async def persist_recovery_async(db: AsyncSession, state: RecoveryState) -> str:
    """
    Persist the recovery outcome using the caller's request-scoped session.

    Writes the case upsert, action, prediction, audit log, recommendation and
    sentiment snapshots, and the agent execution record. Adds to the session
    without committing — the caller commits once. Raises on failure so the
    caller can roll back with full error context.
    """
    case_id_str = state.get("case_id")
    case_id = uuid.UUID(case_id_str) if case_id_str else uuid.uuid4()

    customer_id = (
        uuid.UUID(state["customer_id"]) if state.get("customer_id") else None
    )
    payment_id = (
        uuid.UUID(state["payment_id"]) if state.get("payment_id") else None
    )

    amount = Decimal(str(round(float(state.get("amount") or 0.0), 2)))
    recovery_prob = (
        Decimal(str(state["recovery_probability"]))
        if state.get("recovery_probability") is not None
        else Decimal("0.500")
    )
    risk_level = state.get("risk_level") or "medium"
    channel = state.get("channel") or "email"
    message_content = state.get("message") or ""
    payment_link = state.get("payment_link") or ""

    now = datetime.now(timezone.utc)

    # Check if case exists or create new
    existing_case = None
    if case_id_str:
        res = await db.execute(select(RecoveryCase).where(RecoveryCase.id == case_id))
        existing_case = res.scalar_one_or_none()

    if existing_case:
        existing_case.status = "contacted"
        existing_case.risk_level = risk_level
        existing_case.recovery_probability = recovery_prob
        existing_case.assigned_channel = channel
    else:
        db.add(
            RecoveryCase(
                id=case_id,
                customer_id=customer_id,
                payment_id=payment_id,
                risk_level=risk_level,
                recovery_probability=recovery_prob,
                status="contacted",
                assigned_channel=channel,
                amount=amount,
                created_at=now,
            )
        )

    # Flush the parent case first so child FK rows (actions, predictions,
    # recommendations, sentiment, executions) always see a committed-order
    # parent within this transaction.
    await db.flush()

    # RecoveryAction
    db.add(
        RecoveryAction(
            id=uuid.uuid4(),
            case_id=case_id,
            channel=channel,
            message_content=message_content,
            payment_link=payment_link,
            action_status="sent",
            created_at=now,
        )
    )

    # Prediction record
    db.add(
        Prediction(
            id=uuid.uuid4(),
            case_id=case_id,
            model_version="v1.0-xgb",
            features={
                "amount": float(amount),
                "tenure_days": state.get("tenure_days", 0),
                "engagement_score": state.get("engagement_score", 50.0),
                "previous_successful_recoveries": state.get("previous_successful_recoveries", 0),
                "days_overdue": state.get("days_overdue", 0),
                "failure_reason": state.get("failure_reason", ""),
                "event_type": state.get("event_type", ""),
            },
            predicted_probability=recovery_prob,
            created_at=now,
        )
    )

    # AuditLog
    db.add(
        AuditLog(
            id=uuid.uuid4(),
            actor="agent_recovery_pipeline",
            action="case_contacted_via_langgraph",
            entity_type="recovery_case",
            entity_id=case_id,
            log_metadata={
                "channel": channel,
                "channel_reason": state.get("channel_reason"),
                "risk_level": risk_level,
                "recovery_probability": float(recovery_prob),
                "payment_link": payment_link,
            },
            created_at=now,
        )
    )

    # Recommendation snapshot when available
    if state.get("recommended_channel") or state.get("recommendation_reason"):
        try:
            retry_iso = state.get("recommended_retry_time")
            retry_at = datetime.fromisoformat(retry_iso) if retry_iso else now
        except Exception:
            retry_at = now
        db.add(
            Recommendation(
                id=uuid.uuid4(),
                case_id=case_id,
                recommended_channel=state.get("recommended_channel") or channel,
                recommended_discount=float(state.get("recommended_discount") or 0.0),
                recommended_retry_time=retry_at,
                expected_recovery_rate=float(state.get("expected_recovery_rate") or float(recovery_prob)),
                reasoning={
                    "recommendation_reason": state.get("recommendation_reason"),
                    "channel_reason": state.get("channel_reason"),
                },
            )
        )

    # Sentiment snapshot when available
    if state.get("sentiment") and customer_id is not None:
        db.add(
            CustomerSentiment(
                id=uuid.uuid4(),
                customer_id=customer_id,
                case_id=case_id,
                sentiment=str(state.get("sentiment")),
                score=float(state.get("sentiment_score") or 0.5),
                churn_risk_score=float(state.get("churn_risk_score") or 0.5),
                source_text=f"agent_pipeline:{state.get('failure_reason') or ''}"[:500],
            )
        )

    # Payment reconciliation row when a real link was minted
    if state.get("payment_link_id") and state.get("payment_link"):
        db.add(
            PaymentAttempt(
                id=uuid.uuid4(),
                case_id=case_id,
                razorpay_link_id=str(state.get("payment_link_id")),
                razorpay_order_id=str(state.get("payment_order_id") or "") or None,
                amount=amount,
                currency=state.get("currency") or "INR",
                payment_status="created",
                short_url=str(state.get("payment_link")),
            )
        )

    # Agent execution record
    db.add(
        AgentExecution(
            id=uuid.uuid4(),
            case_id=case_id,
            workflow_version="v2.0-8agent",
            status="error" if state.get("error") else "completed",
            input_data={
                "amount": float(amount),
                "failure_reason": state.get("failure_reason"),
                "event_type": state.get("event_type"),
            },
            output_data={
                "risk_level": risk_level,
                "recovery_probability": float(recovery_prob),
                "channel": channel,
                "payment_link_present": bool(payment_link),
                "error": state.get("error"),
            },
        )
    )

    await db.flush()
    state["case_id"] = str(case_id)
    state["case_status"] = "contacted"
    return str(case_id)
