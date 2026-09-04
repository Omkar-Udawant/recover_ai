from app.agents.state import RecoveryState
from app.integrations.razorpay_client import create_payment_link


def run(state: RecoveryState) -> RecoveryState:
    """
    Agent 6 — Payment Retry:
    Generates a secure Razorpay test-mode payment link for the customer.
    Never fabricates links: on provider failure the error is recorded and
    the pipeline continues without a link.
    """
    amount = float(state.get("amount") or 0.0)
    currency = state.get("currency") or "INR"
    cust_name = state.get("customer_name") or "Valued Customer"
    cust_email = state.get("customer_email") or "customer@example.com"
    cust_phone = state.get("customer_phone") or "+91 9999999999"

    try:
        link_data = create_payment_link(
            amount=amount,
            currency=currency,
            customer_name=cust_name,
            customer_email=cust_email,
            customer_phone=cust_phone,
            description=f"RecoverAI Payment Recovery for {cust_name}",
        )
    except Exception as exc:
        # Record provider failure explicitly; downstream nodes must handle missing link.
        state["payment_link"] = ""
        state["payment_link_id"] = ""
        state["payment_order_id"] = ""
        state["error"] = f"payment_link_failed: {getattr(exc, 'detail', str(exc))}"
        return state

    state["payment_link"] = link_data.get("short_url", "")
    state["payment_link_id"] = link_data.get("id", "")
    state["payment_order_id"] = link_data.get("order_id") or ""
    state["error"] = None
    return state
