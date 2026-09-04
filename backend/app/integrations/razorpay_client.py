from typing import Any, Dict
import razorpay
from fastapi import HTTPException, status
from app.core.config import settings


def create_payment_link(
    amount: float,
    currency: str = "INR",
    customer_name: str = "Valued Customer",
    customer_email: str = "customer@example.com",
    customer_phone: str = "+91 9999999999",
    description: str = "RecoverAI Payment Link",
) -> Dict[str, Any]:
    """
    Generates a real Razorpay payment link. The application never fabricates links.
    """
    amount_in_paise = int(round(amount * 100))
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Razorpay test credentials are not configured")
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        res = client.payment_link.create({"amount": amount_in_paise, "currency": currency, "accept_partial": False, "description": description, "customer": {"name": customer_name, "email": customer_email, "contact": customer_phone}, "notify": {"sms": True, "email": True}, "reminder_enable": True})
    except razorpay.errors.BadRequestError as exc:
        raise HTTPException(status_code=422, detail="Razorpay rejected the payment-link request") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Razorpay payment-link creation failed") from exc
    return {"id": res["id"], "short_url": res["short_url"], "status": res.get("status", "created"), "order_id": res.get("order_id"), "amount": amount, "currency": currency}
