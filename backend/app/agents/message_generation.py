from app.agents.state import RecoveryState
from app.integrations.gemini_client import generate_message_with_gemini


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 7 — Message Generation:
    Generates personalized outreach copy tailored to the customer and channel.
    Payment link is interpolated only when a real link exists.
    """
    tone = state.get("tone") or "professional"
    payment_link = state.get("payment_link") or ""

    message = generate_message_with_gemini(
        customer_name=state.get("customer_name") or "Valued Customer",
        amount=float(state.get("amount") or 0.0),
        currency=state.get("currency") or "INR",
        tone=tone,
        event_type=state.get("event_type") or "payment_failed",
        payment_link=payment_link,
    )

    state["message"] = message
    return state
