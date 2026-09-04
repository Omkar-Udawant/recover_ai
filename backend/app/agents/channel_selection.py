from app.agents.state import RecoveryState
from app.integrations.gemini_client import select_channel_with_gemini


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 3 — Channel Selection:
    Calls Google Gemini to select the optimal outreach channel with structured reasoning.
    """
    result = select_channel_with_gemini(
        customer_name=state.get("customer_name") or "Valued Customer",
        amount=float(state.get("amount") or 0.0),
        risk_level=state.get("risk_level") or "medium",
        recovery_prob=float(state.get("recovery_probability") or 0.5),
        engagement_score=float(state.get("engagement_score") or 55.0),
        days_overdue=int(state.get("days_overdue") or 0),
    )

    state["channel"] = result.get("channel", "email")
    state["channel_reason"] = result.get("reason", "Optimal engagement channel selected.")
    return state
