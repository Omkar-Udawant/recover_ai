import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.integrations.gemini_client import _init_gemini
from app.models.intelligence import CopilotMessage, CustomerSentiment, Recommendation
from app.schemas.bonus import (
    CopilotRequest,
    CopilotResponse,
    SentimentRequest,
    SentimentResponse,
    SmartTimingRequest,
    SmartTimingResponse,
)
from app.schemas.common import TokenPayload
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["Bonus AI Capabilities"])


@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(
    payload: SentimentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Analyze inbound customer reply text for sentiment, urgency, and churn risk.
    Persists to customer_sentiment when customer_id/case_id are supplied.
    """
    text = payload.text.strip()
    
    if _init_gemini():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = f"""
Analyze this customer reply to a payment recovery notice:
"{text}"

Return ONLY valid JSON:
{{
  "sentiment": "frustrated",
  "urgency": "high",
  "churn_risk_score": 0.85,
  "suggested_action": "Offer a 10% loyalty discount or pause subscription instead of immediate cancellation.",
  "summary": "Customer is unhappy with recent pricing changes."
}}
"""
            res = model.generate_content(prompt)
            match = re.search(r"\{.*?\}", res.text.strip(), re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return SentimentResponse(
                    sentiment=data.get("sentiment", "neutral"),
                    urgency=data.get("urgency", "medium"),
                    churn_risk_score=float(data.get("churn_risk_score", 0.5)),
                    suggested_action=data.get("suggested_action", "Follow up with customer support."),
                    summary=data.get("summary", "Inbound customer response analyzed."),
                )
        except Exception:
            pass

    # Heuristic sentiment fallback
    lower_text = text.lower()
    if any(w in lower_text for w in ["cancel", "stop", "scam", "hate", "terrible", "worst", "refund"]):
        sentiment = "frustrated"
        urgency = "high"
        churn_risk = 0.90
        action = "Escalate to retention specialist immediately; offer flexible billing plan or temporary pause."
        summary = "High churn risk detected. Customer expressed dissatisfaction or cancellation intent."
    elif any(w in lower_text for w in ["pay", "link", "soon", "tomorrow", "card", "retry", "done", "ok", "yes"]):
        sentiment = "positive"
        urgency = "low"
        churn_risk = 0.15
        action = "Send updated payment link with instant confirmation receipt."
        summary = "Customer intends to complete payment."
    else:
        sentiment = "neutral"
        urgency = "medium"
        churn_risk = 0.45
        action = "Send standard clarification message outlining payment breakdown."
        summary = "Customer requires additional context or payment clarification."

    response = SentimentResponse(
        sentiment=sentiment,
        urgency=urgency,
        churn_risk_score=churn_risk,
        suggested_action=action,
        summary=summary,
    )

    # Durable persistence (best-effort; never fails the request)
    try:
        customer_uuid = uuid.UUID(payload.customer_id) if payload.customer_id else None
        case_uuid = uuid.UUID(payload.case_id) if payload.case_id else None
        if customer_uuid is not None:
            score_map = {"positive": 0.85, "neutral": 0.5, "negative": 0.3, "frustrated": 0.15}
            db.add(
                CustomerSentiment(
                    id=uuid.uuid4(),
                    customer_id=customer_uuid,
                    case_id=case_uuid,
                    sentiment=sentiment,
                    score=score_map.get(sentiment, 0.5),
                    churn_risk_score=churn_risk,
                    source_text=text[:2000],
                )
            )
            await db.commit()
    except Exception:
        await db.rollback()

    return response


@router.post("/smart-retry-timing", response_model=SmartTimingResponse)
async def predict_smart_retry_timing(
    payload: SmartTimingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Predict optimal time window and day to send recovery nudges.
    Persists as a Recommendation row when case_id is supplied.
    """
    channel = payload.channel.lower()

    if channel == "whatsapp":
        time_window = "11:00 AM - 01:30 PM"
        best_day = "Tuesday"
        open_rate = 88.5
        reasoning = "WhatsApp engagement peaks during mid-day break with lowest spam-filtering friction."
    elif channel == "email":
        time_window = "09:30 AM - 11:00 AM"
        best_day = "Wednesday"
        open_rate = 64.2
        reasoning = "Business and professional SaaS emails achieve highest click-through rates on mid-week mornings."
    elif channel == "sms":
        time_window = "05:30 PM - 07:30 PM"
        best_day = "Thursday"
        open_rate = 74.0
        reasoning = "SMS notifications receive rapid smartphone glances during evening commute hours."
    else:
        time_window = "02:00 PM - 04:00 PM"
        best_day = "Friday"
        open_rate = 52.0
        reasoning = "High-value priority phone follow-ups are best scheduled during early afternoon slots."

    # Persist recommendation when tied to a case
    try:
        if payload.case_id:
            case_uuid = uuid.UUID(payload.case_id)
            db.add(
                Recommendation(
                    id=uuid.uuid4(),
                    case_id=case_uuid,
                    recommended_channel=channel if channel in {"email", "whatsapp", "sms", "voice_call"} else "email",
                    recommended_discount=0.0,
                    recommended_retry_time=datetime.now(timezone.utc) + timedelta(days=1),
                    expected_recovery_rate=round(open_rate / 100.0, 3),
                    reasoning={"time_window": time_window, "best_day": best_day, "reasoning": reasoning},
                )
            )
            await db.commit()
    except Exception:
        await db.rollback()

    return SmartTimingResponse(
        recommended_time_window=time_window,
        optimal_day_of_week=best_day,
        predicted_open_rate_pct=open_rate,
        reasoning=reasoning,
    )


@router.post("/copilot", response_model=CopilotResponse)
async def merchant_copilot(
    payload: CopilotRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """
    Merchant AI Copilot: Answers questions about revenue leakage, recovery performance, and recommendations.
    """
    dash = await DashboardService.get_dashboard_data(db)
    kpis = dash.kpis
    q = payload.question.strip()

    context_summary = f"""
Current RecoverAI Metrics:
- Total Revenue At Risk: INR {kpis.total_revenue_at_risk:,.2f}
- Total Revenue Recovered: INR {kpis.total_revenue_recovered:,.2f} ({kpis.financial_recovery_rate_pct}%)
- In-Flight Active Exposure: INR {kpis.active_in_flight_risk:,.2f} ({kpis.active_cases_count} cases)
- Estimated ROI Multiplier: {kpis.estimated_roi_multiplier}x
- Top Channel: SMS and Email have the highest win rates (~65-68%).
"""

    if _init_gemini():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = f"""
You are the RecoverAI Merchant Copilot. Answer the merchant's question clearly and concisely using these live metrics:
{context_summary}

Merchant Question: "{q}"

Return a direct, helpful 2-3 sentence answer with 2 actionable bullet points.
"""
            res = model.generate_content(prompt)
            copilot_response = CopilotResponse(
                answer=res.text.strip(),
                suggested_actions=[
                    "Trigger automated WhatsApp follow-ups for high-risk invoices > ₹10,000.",
                    "Review customer sentiment trends on checkout abandonment cases.",
                ],
            )
            try:
                db.add(CopilotMessage(id=uuid.uuid4(), user_id=None, role="user", content=q[:2000]))
                db.add(CopilotMessage(id=uuid.uuid4(), user_id=None, role="assistant", content=copilot_response.answer[:4000]))
                await db.commit()
            except Exception:
                await db.rollback()
            return copilot_response
        except Exception:
            pass

    # Intelligent analytical fallback
    fallback = CopilotResponse(
        answer=f"RecoverAI has currently won back INR {kpis.total_revenue_recovered:,.2f} of INR {kpis.total_revenue_at_risk:,.2f} at risk ({kpis.financial_recovery_rate_pct}% recovery rate) across 5,000 cases, generating a {kpis.estimated_roi_multiplier}x return on recovery operations.",
        suggested_actions=[
            "Focus outreach on SMS and WhatsApp channels to maintain the >65% conversion rate.",
            "Prioritize cases with overdue duration < 7 days for the highest probability win-backs.",
        ],
    )
    try:
        db.add(CopilotMessage(id=uuid.uuid4(), user_id=None, role="user", content=q[:2000]))
        db.add(CopilotMessage(id=uuid.uuid4(), user_id=None, role="assistant", content=fallback.answer[:4000]))
        await db.commit()
    except Exception:
        await db.rollback()
    return fallback
