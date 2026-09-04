from app.agents.state import RecoveryState


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 1 — Risk Detection:
    Performs initial rule-based risk classification based on overdue duration, event type, and amount.
    """
    days_overdue = int(state.get("days_overdue") or 0)
    amount = float(state.get("amount") or 0.0)
    event_type = str(state.get("event_type") or "").lower()

    if days_overdue > 14 or amount > 25000:
        initial_risk = "high"
    elif days_overdue > 5 or amount > 8000 or event_type == "invoice_overdue":
        initial_risk = "medium"
    else:
        initial_risk = "low"

    state["risk_level"] = initial_risk
    state["case_status"] = "pending"
    return state
