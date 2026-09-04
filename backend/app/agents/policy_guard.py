"""Policy guardrails: the refusal engine.

Before the agent spends an outreach attempt it must pass every rule below.
A refusal is a first-class, persisted outcome (AgentExecution status
"refused" + audit log), never a silent skip — restraint is the feature.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.intelligence import AgentExecution
from app.models.recovery_action import RecoveryAction
from app.models.recovery_case import RecoveryCase

IST = ZoneInfo("Asia/Kolkata")

TERMINAL_STATUSES = {"recovered", "lost"}


async def evaluate_policy(
    db: AsyncSession,
    *,
    case_id: Optional[UUID],
    amount: float,
    recovery_probability: float,
    channel: Optional[str] = None,
) -> Tuple[bool, str, Dict[str, Any]]:
    """Return (allowed, reason_code, details). reason_code is "ok" when allowed."""
    now = datetime.now(timezone.utc)
    details: Dict[str, Any] = {
        "amount": amount,
        "recovery_probability": recovery_probability,
        "checked_at": now.isoformat(),
    }

    # 0. Unknown case (ad-hoc run): only economic + quiet-hours rules apply.
    case = None
    if case_id is not None:
        case = await db.get(RecoveryCase, case_id)
        if case is None:
            return False, "case_not_found", details
        details["case_status"] = case.status
        if case.status in TERMINAL_STATUSES:
            return False, "already_resolved", details

    # 1. Attempt cap per case (rolling 30 days).
    if case_id is not None:
        window_start = now - timedelta(days=30)
        res = await db.execute(
            select(func.count())
            .select_from(RecoveryAction)
            .where(
                RecoveryAction.case_id == case_id,
                RecoveryAction.created_at >= window_start,
            )
        )
        attempts = int(res.scalar() or 0)
        details["attempts_last_30d"] = attempts
        if attempts >= settings.POLICY_MAX_ATTEMPTS_PER_CASE_30D:
            return False, "attempt_cap", details

        # 2. Cooldown since last attempt.
        res = await db.execute(
            select(RecoveryAction.created_at)
            .where(RecoveryAction.case_id == case_id)
            .order_by(RecoveryAction.created_at.desc())
            .limit(1)
        )
        last_at = res.scalar_one_or_none()
        if last_at is not None:
            if last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=timezone.utc)
            hours_since = (now - last_at).total_seconds() / 3600.0
            details["hours_since_last_attempt"] = round(hours_since, 2)
            if hours_since < settings.POLICY_COOLDOWN_HOURS:
                return False, "cooldown", details

    # 3. Expected-value gate: refuse when the outreach costs more than it can earn.
    expected_value = recovery_probability * amount
    details["expected_value_inr"] = round(expected_value, 2)
    details["min_expected_value_inr"] = settings.POLICY_MIN_EXPECTED_VALUE_INR
    if expected_value < settings.POLICY_MIN_EXPECTED_VALUE_INR:
        return False, "low_expected_value", details

    # 4. Quiet hours (IST): no customer-facing outreach at night.
    if settings.POLICY_QUIET_HOURS_ENFORCE:
        ist_now = now.astimezone(IST)
        details["ist_hour"] = ist_now.hour
        start, end = settings.POLICY_QUIET_START_HOUR_IST, settings.POLICY_QUIET_END_HOUR_IST
        in_quiet = (ist_now.hour >= start or ist_now.hour < end) if start > end else (start <= ist_now.hour < end)
        if in_quiet:
            return False, "quiet_hours", details

    if channel:
        details["channel"] = channel
    return True, "ok", details


async def record_refusal(
    db: AsyncSession,
    *,
    case_id: Optional[UUID],
    reason: str,
    details: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
) -> None:
    """Persist a refusal as a first-class outcome (adds only; caller commits)."""
    now = datetime.now(timezone.utc)
    db.add(
        AgentExecution(
            id=uuid4(),
            case_id=case_id,
            workflow_version="v2.0-8agent",
            status="refused",
            input_data=context or {},
            output_data={"decision": "refused", "refusal_reason": reason, "details": details},
        )
    )
    if case_id is not None:
        db.add(
            AuditLog(
                id=uuid4(),
                actor="policy_guard",
                action=f"refused_{reason}",
                entity_type="recovery_case",
                entity_id=case_id,
                log_metadata={"refusal_reason": reason, "details": details},
                created_at=now,
            )
        )
