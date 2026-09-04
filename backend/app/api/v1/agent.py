import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import recovery_graph
from app.agents.policy_guard import evaluate_policy, record_refusal
from app.agents.recovery_tracking import persist_recovery_async
from app.agents.state import RecoveryState
from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models import AuditLog, Customer, Payment, RecoveryCase
from app.schemas.agent import (
    AgentRunRequest,
    AgentRunResponse,
    BatchCaseResult,
    BatchRunRequest,
    BatchRunResponse,
)
from app.schemas.common import TokenPayload

logger = logging.getLogger("recoverai.agent")

OPEN_STATUSES = ["pending", "contacted", "link_opened", "payment_attempted"]

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

    # Policy guardrails: refuse wasteful/duplicative/non-compliant outreach
    # before spending an attempt. A refusal is persisted, never silent.
    if payload.respect_policy and not payload.force:
        gate_case_id = None
        gate_prob, gate_amount = 0.5, float(initial_state.get("amount") or 0.0)
        if initial_state.get("case_id"):
            try:
                gate_case_id = uuid.UUID(initial_state["case_id"])
                gate_case = await db.get(RecoveryCase, gate_case_id)
                if gate_case is None:
                    gate_case_id = None
                else:
                    gate_prob = float(gate_case.recovery_probability or 0.5)
                    gate_amount = float(gate_case.amount or gate_amount)
            except Exception:
                gate_case_id = None
        allowed, reason, details = await evaluate_policy(
            db,
            case_id=gate_case_id,
            amount=gate_amount,
            recovery_probability=gate_prob,
        )
        if not allowed:
            try:
                await record_refusal(
                    db,
                    case_id=gate_case_id,
                    reason=reason,
                    details=details,
                    context={
                        "payment_id": initial_state.get("payment_id"),
                        "amount": gate_amount,
                        "tone": initial_state.get("tone"),
                    },
                )
                await db.commit()
            except Exception:
                await db.rollback()
            return AgentRunResponse(
                case_id=initial_state.get("case_id") or str(uuid.uuid4()),
                payment_id=initial_state.get("payment_id") or str(uuid.uuid4()),
                risk_level="unknown",
                recovery_probability=gate_prob,
                channel="none",
                channel_reason=f"Refused by policy guard: {reason}.",
                message=f"No outreach sent. Policy refusal ({reason}): {details}.",
                payment_link="",
                case_status="pending",
                decision="refused",
                refusal_reason=reason,
            )
    elif payload.force:
        try:
            db.add(
                AuditLog(
                    id=uuid.uuid4(),
                    actor=str(current_user.sub),
                    action="policy_override",
                    entity_type="recovery_case",
                    entity_id=uuid.UUID(initial_state["case_id"]) if initial_state.get("case_id") else None,
                    log_metadata={"forced": True},
                )
            )
            await db.commit()
        except Exception:
            await db.rollback()

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
        decision="acted",
        refusal_reason=None,
    )


async def _build_state_for_case(
    db: AsyncSession, rc: RecoveryCase, tone: str
) -> dict:
    """Build a graph initial state from a case + its relations."""
    cust = await db.get(Customer, rc.customer_id) if rc.customer_id else None
    pay = await db.get(Payment, rc.payment_id) if rc.payment_id else None
    return {
        "payment_id": str(pay.id) if pay else str(uuid.uuid4()),
        "customer_id": str(cust.id) if cust else (str(rc.customer_id) if rc.customer_id else str(uuid.uuid4())),
        "event_type": pay.event_type if pay else "payment_failed",
        "amount": float(rc.amount or (pay.amount if pay else 0.0)),
        "currency": pay.currency if pay else "INR",
        "customer_name": cust.name if cust else "Valued Customer",
        "customer_email": cust.email if cust else "customer@example.com",
        "customer_phone": cust.phone if cust else "+91 9999999999",
        "tenure_days": cust.tenure_days if cust else 120,
        "engagement_score": float(cust.engagement_score) if cust else 65.0,
        "previous_successful_recoveries": cust.previous_successful_recoveries if cust else 0,
        "days_overdue": pay.days_overdue if pay else 0,
        "failure_reason": pay.failure_reason if pay and pay.failure_reason else "insufficient_funds",
        "tone": tone,
        "risk_level": None,
        "recovery_probability": None,
        "channel": None,
        "channel_reason": None,
        "message": None,
        "payment_link": None,
        "case_id": str(rc.id),
        "case_status": rc.status,
        "error": None,
    }


@router.post("/run-batch", response_model=BatchRunResponse)
async def run_recovery_batch(
    payload: BatchRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Bounded batch recovery: rank open cases by expected value, apply policy
    guardrails to each, act on the allowed ones, and report measured honesty
    metrics (acted / refused-by-reason / projected net). dry_run persists nothing.
    """
    value = func.coalesce(RecoveryCase.amount, 0) * func.coalesce(RecoveryCase.recovery_probability, 0)
    res = await db.execute(
        select(RecoveryCase)
        .where(RecoveryCase.status.in_(OPEN_STATUSES))
        .order_by(value.desc())
        .limit(payload.limit)
    )
    candidates = list(res.scalars().all())

    results: list[BatchCaseResult] = []
    refusals_by_reason: dict[str, int] = {}
    acted = refused = 0
    batch_at_risk = 0.0
    projected_gross = 0.0

    for rc in candidates:
        prob = float(rc.recovery_probability or 0.5)
        amount = float(rc.amount or 0.0)
        batch_at_risk += amount
        try:
            if payload.respect_policy:
                allowed, reason, details = await evaluate_policy(
                    db, case_id=rc.id, amount=amount, recovery_probability=prob
                )
            else:
                allowed, reason, details = True, "ok", {}
            expected = prob * amount
            if not allowed:
                refused += 1
                refusals_by_reason[reason] = refusals_by_reason.get(reason, 0) + 1
                if not payload.dry_run:
                    try:
                        await record_refusal(
                            db, case_id=rc.id, reason=reason, details=details,
                            context={"batch": True, "amount": amount, "tone": payload.tone},
                        )
                        await db.commit()
                    except Exception:
                        await db.rollback()
                results.append(BatchCaseResult(
                    case_id=str(rc.id), decision="would_refuse" if payload.dry_run else "refused",
                    refusal_reason=reason, expected_value_inr=round(expected, 2),
                ))
                continue
            if payload.dry_run:
                acted += 1
                projected_gross += expected
                results.append(BatchCaseResult(
                    case_id=str(rc.id), decision="would_act", expected_value_inr=round(expected, 2),
                ))
                continue
            state = await _build_state_for_case(db, rc, payload.tone or "professional")
            final_state = recovery_graph.invoke(state)
            try:
                await persist_recovery_async(db, final_state)
                await db.commit()
            except Exception:
                await db.rollback()
                raise
            acted += 1
            projected_gross += float(final_state.get("recovery_probability") or prob) * amount
            results.append(BatchCaseResult(
                case_id=str(rc.id), decision="acted",
                risk_level=final_state.get("risk_level") or "medium",
                channel=final_state.get("channel") or "email",
                expected_value_inr=round(expected, 2),
            ))
        except Exception as exc:
            logger.exception("Batch case failed")
            await db.rollback()
            results.append(BatchCaseResult(case_id=str(rc.id), decision="error", refusal_reason=str(exc)[:200]))

    projected_net = round(projected_gross - acted * settings.POLICY_COST_PER_ATTEMPT_INR, 2)
    return BatchRunResponse(
        considered=len(candidates), acted=acted, refused=refused,
        refusals_by_reason=refusals_by_reason,
        batch_at_risk_inr=round(batch_at_risk, 2),
        projected_net_inr=projected_net,
        results=results,
    )


@router.get("/honesty")
async def recovery_honesty(
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Wapsi-style honesty metrics: net recovered, % of ceiling, attempt discipline."""
    recovered = (await db.execute(
        text("SELECT COALESCE(SUM(amount),0) FROM recovery_cases WHERE status='recovered'"))).scalar() or 0
    ceiling = (await db.execute(text("SELECT COALESCE(SUM(amount),0) FROM recovery_cases"))).scalar() or 0
    attempts_all = (await db.execute(text("SELECT COUNT(*) FROM recovery_actions"))).scalar() or 0
    refused_30 = (await db.execute(text(
        "SELECT COUNT(*) FROM agent_executions WHERE status='refused' AND created_at >= NOW() - INTERVAL '30 days'"))).scalar() or 0
    acted_30 = (await db.execute(text(
        "SELECT COUNT(*) FROM recovery_actions WHERE created_at >= NOW() - INTERVAL '30 days'"))).scalar() or 0
    by_reason = (await db.execute(text(
        "SELECT output_data->>'refusal_reason' AS reason, COUNT(*) FROM agent_executions "
        "WHERE status='refused' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY reason ORDER BY COUNT(*) DESC"))).fetchall()
    recent = (await db.execute(text(
        "SELECT ae.case_id, ae.output_data->>'refusal_reason' AS reason, ae.created_at, rc.amount "
        "FROM agent_executions ae LEFT JOIN recovery_cases rc ON rc.id = ae.case_id "
        "WHERE ae.status='refused' ORDER BY ae.created_at DESC LIMIT 8"))).fetchall()

    recovered_f, ceiling_f = float(recovered), float(ceiling)
    return {
        "net_recovered_inr": round(recovered_f - int(attempts_all) * settings.POLICY_COST_PER_ATTEMPT_INR, 2),
        "recovered_inr": round(recovered_f, 2),
        "ceiling_inr": round(ceiling_f, 2),
        "pct_of_ceiling": round((recovered_f / ceiling_f) * 100.0, 1) if ceiling_f > 0 else 0.0,
        "attempts_30d": int(acted_30),
        "refused_30d": int(refused_30),
        "refusals_by_reason": {r[0] or "unknown": int(r[1]) for r in by_reason},
        "recent_refusals": [
            {"case_id": str(r[0]) if r[0] else None, "reason": r[1], "at": r[2].isoformat() if r[2] else None,
             "amount": float(r[3]) if r[3] is not None else None}
            for r in recent
        ],
        "cost_per_attempt_inr": settings.POLICY_COST_PER_ATTEMPT_INR,
    }
