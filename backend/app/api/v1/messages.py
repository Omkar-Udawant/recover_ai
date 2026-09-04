from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.integrations.gemini_client import generate_message_with_gemini
from app.schemas.agent import GenerateMessageRequest, GenerateMessageResponse
from app.schemas.common import TokenPayload

router = APIRouter(tags=["AI Message Generation"])


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
        payment_link=payload.payment_link or "https://rzp.io/i/test_link",
    )

    return GenerateMessageResponse(
        message=msg,
        tone=payload.tone,
        customer_name=payload.customer_name,
    )
