import hashlib
import hmac
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.api.deps import get_db
from app.core.config import settings
from app.integrations.razorpay_client import create_payment_link
from app.models.intelligence import PaymentAttempt
from app.models.recovery_case import RecoveryCase
from app.schemas.payments import PaymentLinkRequest, PaymentLinkResponse
from app.schemas.agent import RetryPaymentRequest, RetryPaymentResponse
from app.schemas.common import TokenPayload

router = APIRouter(tags=["Payment Links"])

@router.post("/payment-link", response_model=PaymentLinkResponse, status_code=status.HTTP_201_CREATED)
async def payment_link(payload: PaymentLinkRequest, db: AsyncSession = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    case = await db.get(RecoveryCase, payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case was not found")
    result = create_payment_link(payload.amount, payload.currency.upper(), payload.customer_name, payload.customer_email, payload.customer_phone, f"RecoverAI recovery case {case.id}")
    db.add(PaymentAttempt(case_id=case.id, razorpay_link_id=result["id"], razorpay_order_id=result.get("order_id"), amount=payload.amount, currency=payload.currency.upper(), payment_status=result["status"]))
    await db.commit()
    return PaymentLinkResponse(payment_link=result["short_url"], order_id=result.get("order_id"), amount=payload.amount, status=result["status"], link_id=result["id"], currency=payload.currency.upper())


@router.post("/retry-payment", response_model=RetryPaymentResponse)
async def retry_payment(
    payload: RetryPaymentRequest,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Generate a secure Razorpay Test Mode payment link for recovery retries.
    """
    res = create_payment_link(
        amount=payload.amount,
        currency=payload.currency,
        customer_name=payload.customer_name or "Valued Customer",
        customer_email=payload.customer_email or "customer@example.com",
        customer_phone=payload.customer_phone or "+91 9999999999",
    )

    return RetryPaymentResponse(
        payment_link=res["short_url"],
        link_id=res["id"],
        status=res["status"],
        amount=payload.amount,
        currency=payload.currency,
    )

@router.post("/webhooks/razorpay", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
async def razorpay_webhook(request: Request, x_razorpay_signature: str | None = Header(default=None), db: AsyncSession = Depends(get_db)):
    raw = await request.body()
    if not settings.RAZORPAY_WEBHOOK_SECRET or not x_razorpay_signature:
        raise HTTPException(status_code=401, detail="Webhook signature missing")
    expected = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Webhook signature invalid")
    try:
        event = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid webhook payload")
    if event.get("event") not in {"payment_link.paid", "payment_link.expired", "payment_link.partially_paid"}:
        return
    entity = event.get("payload", {}).get("payment_link", {}).get("entity", {})
    link_id = entity.get("id")
    attempt = (await db.execute(select(PaymentAttempt).where(PaymentAttempt.razorpay_link_id == link_id))).scalar_one_or_none()
    if not attempt:
        return
    attempt.payment_status = entity.get("status", "unknown")
    attempt.payment_reference = entity.get("payment_id")
    attempt.payment_time = datetime.now(timezone.utc)
    if attempt.payment_status == "paid":
        case = await db.get(RecoveryCase, attempt.case_id)
        if case:
            case.status, case.recovered_at = "recovered", datetime.now(timezone.utc)
    await db.commit()
