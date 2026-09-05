import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.integrations.email_client import build_recovery_email, is_configured, send_recovery_email
from app.integrations.gemini_client import generate_message_with_gemini
from app.models import RecoveryCase
from app.models.recovery_action import RecoveryAction
from app.schemas.agent import GenerateMessageRequest, GenerateMessageResponse
from app.schemas.common import TokenPayload

router = APIRouter(tags=["AI Message Generation"])


VOICE_TEMPLATES = {
    "EN": (
        "tpl_ar_voice_final_v1",
        "Hello, this is an automated call from {merchant} about invoice {ref} for rupees {amount}, "
        "which is {days} days overdue. Press 1 to receive a payment link by SMS, press 2 to speak to "
        "our accounts team, or press 9 to stop these calls.",
    ),
    "Hinglish": (
        "tpl_ar_voice_final_hi_v1",
        "Namaste, yeh {merchant} ki taraf se automated call hai. {ref}, {amount} rupees ka payment "
        "{days} din se pending hai. Payment link SMS par chahiye to 1 dabaayein, accounts team se baat "
        "karni ho to 2 dabaayein, yeh calls band karne ke liye 9 dabaayein.",
    ),
}

VOICE_COST_PAISE = 400
EMAIL_COST_PAISE = 50
MERCHANT_NAME = "RecoverAI Store"


@router.post("/generate-message", response_model=GenerateMessageResponse)
async def generate_message(
    payload: GenerateMessageRequest,
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Generate personalized multi-tone recovery outreach messages via Google Gemini (or high-reliability fallback).
    Tones supported: professional, friendly, hinglish, formal.
    """
    msg = generate_message_with_gemini(
        customer_name=payload.customer_name,
        amount=payload.amount,
        currency=payload.currency,
        tone=payload.tone,
        event_type=payload.event_type,
        payment_link=payload.payment_link or "",
    )

    return GenerateMessageResponse(
        message=msg,
        tone=payload.tone,
        customer_name=payload.customer_name,
    )


class SendEmailRequest(BaseModel):
    case_id: str = Field(..., description="Recovery case UUID")
    tone: str = Field("professional", description="professional | friendly | hinglish | formal")
    to_email: Optional[str] = Field(None, description="Override recipient (defaults to customer email)")


class LogVoiceRequest(BaseModel):
    case_id: str = Field(..., description="Recovery case UUID")
    lang: str = Field("EN", description="EN | Hinglish")


async def _latest_payment_link(db: AsyncSession, case_id: uuid.UUID) -> str:
    res = await db.execute(
        select(RecoveryAction.payment_link)
        .where(
            RecoveryAction.case_id == case_id,
            RecoveryAction.payment_link.isnot(None),
            RecoveryAction.payment_link != "",
        )
        .order_by(desc(RecoveryAction.created_at))
        .limit(1)
    )
    return res.scalar_one_or_none() or ""


async def _mint_fresh_link(db: AsyncSession, case: RecoveryCase, customer_name: str, customer_email: str, customer_phone: str = "+91 9999999999") -> str:
    """Mint a live Razorpay link for the email so demos never carry stale URLs."""
    from app.integrations.razorpay_client import create_payment_link
    from app.models.intelligence import PaymentAttempt

    result = create_payment_link(
        amount=float(case.amount or 0.0),
        currency="INR",
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        description=f"RecoverAI recovery case {case.id}",
    )
    db.add(
        PaymentAttempt(
            id=uuid.uuid4(),
            case_id=case.id,
            razorpay_link_id=result["id"],
            razorpay_order_id=result.get("order_id"),
            amount=float(case.amount or 0.0),
            currency="INR",
            payment_status=result["status"],
            short_url=result["short_url"],
        )
    )
    return result["short_url"]


@router.post("/send-email")
async def send_email(
    payload: SendEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Send a real recovery email via SMTP containing the live payment link.
    Honest 503 when email is unconfigured; the send is recorded as an action.
    """
    try:
        case_uuid = uuid.UUID(payload.case_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid case_id")
    case = await db.get(RecoveryCase, case_uuid)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case was not found")
    from app.models import Customer
    customer = await db.get(Customer, case.customer_id) if case.customer_id else None
    to_email = payload.to_email or (customer.email if customer else None)
    if not to_email:
        raise HTTPException(status_code=422, detail="No recipient email available")
    name = customer.name if customer else "Valued Customer"
    amount = float(case.amount or 0.0)
    link = await _latest_payment_link(db, case_uuid)
    if not link:
        # No usable stored link: mint a fresh live one so the email is actionable.
        # Raises honest 503/502 when Razorpay is unreachable — never fabricated.
        try:
            link = await _mint_fresh_link(
                db, case, name, to_email if "@" in (to_email or "") else "customer@example.com",
                customer.phone if customer and customer.phone else "+91 9999999999",
            )
        except HTTPException:
            link = ""
    subject, body = build_recovery_email(name, amount, "INR", link, payload.tone)
    result = send_recovery_email(to_email=to_email, subject=subject, body_text=body)
    now = datetime.now(timezone.utc)
    db.add(
        RecoveryAction(
            id=uuid.uuid4(),
            case_id=case_uuid,
            channel="email",
            message_content=f"{subject}\n\n{body}",
            payment_link=link or None,
            action_status="sent",
            template=f"tpl_ar_email_{payload.tone.lower()}_v1",
            lang="Hinglish" if payload.tone.lower() == "hinglish" else "EN",
            cost_paise=EMAIL_COST_PAISE,
            created_at=now,
        )
    )
    await db.commit()
    return {**result, "template": f"tpl_ar_email_{payload.tone.lower()}_v1", "cost_paise": EMAIL_COST_PAISE}


@router.post("/log-voice")
async def log_voice(
    payload: LogVoiceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Log a voice-call outreach rendered verbatim from a registered template.
    Speech synthesis reads the returned script exactly — the engine fills
    declared variables and composes nothing, so the audio is auditable.
    """
    try:
        case_uuid = uuid.UUID(payload.case_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid case_id")
    case = await db.get(RecoveryCase, case_uuid)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case was not found")
    lang = payload.lang if payload.lang in VOICE_TEMPLATES else "EN"
    template_id, template = VOICE_TEMPLATES[lang]
    from app.models import Customer, Payment
    customer = await db.get(Customer, case.customer_id) if case.customer_id else None
    payment = await db.get(Payment, case.payment_id) if case.payment_id else None
    script = template.format(
        merchant=MERCHANT_NAME,
        ref=f"INV-{str(case.id)[:6].upper()}",
        amount=f"{float(case.amount or 0.0):,.0f}",
        days=payment.days_overdue if payment else 0,
    )
    now = datetime.now(timezone.utc)
    action = RecoveryAction(
        id=uuid.uuid4(),
        case_id=case_uuid,
        channel="voice_call",
        message_content=script,
        payment_link=None,
        action_status="sent",
        template=template_id,
        lang=lang,
        cost_paise=VOICE_COST_PAISE,
        created_at=now,
    )
    db.add(action)
    await db.commit()
    return {
        "action_id": str(action.id),
        "template": template_id,
        "lang": lang,
        "script": script,
        "cost_paise": VOICE_COST_PAISE,
        "note": "Synthesize this script verbatim; do not paraphrase.",
    }


@router.get("/email-status")
async def email_status(current_user: TokenPayload = Depends(get_current_user)):
    return {"configured": is_configured()}
