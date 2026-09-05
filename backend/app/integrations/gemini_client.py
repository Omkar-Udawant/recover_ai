import json
import re
from typing import Any, Dict, Optional
from app.core.config import settings

# In-memory Gemini client
_gemini_configured = False


def _init_gemini():
    global _gemini_configured
    if not _gemini_configured and settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _gemini_configured = True
        except Exception:
            _gemini_configured = False
    return _gemini_configured


def select_channel_with_gemini(
    customer_name: str,
    amount: float,
    risk_level: str,
    recovery_prob: float,
    engagement_score: float,
    days_overdue: int,
) -> Dict[str, str]:
    """
    Uses Gemini to intelligently select the optimal recovery channel with fallback.
    """
    if _init_gemini():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = f"""
You are an AI Revenue Recovery Agent. Select the single best communication channel for this customer.
Channels available: email, whatsapp, sms, voice_call.

Customer details:
- Name: {customer_name}
- Amount: INR {amount:.2f}
- Risk Level: {risk_level}
- Predicted Recovery Probability: {recovery_prob:.2f}
- Engagement Score: {engagement_score:.1f}/100
- Days Overdue: {days_overdue} days

Return ONLY valid JSON matching this exact format:
{{"channel": "whatsapp", "reason": "High transaction value requires immediate, interactive messaging with high open rates."}}
"""
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Extract JSON block
            match = re.search(r"\{.*?\}", text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                channel = str(parsed.get("channel", "")).lower()
                if channel in ["email", "whatsapp", "sms", "voice_call"]:
                    return {
                        "channel": channel,
                        "reason": str(parsed.get("reason", "Selected based on customer engagement profile.")),
                    }
        except Exception:
            pass

    # High-reliability fallback heuristic
    if amount >= 10000 or risk_level == "high":
        return {
            "channel": "whatsapp",
            "reason": "High financial amount and risk tier warrants instant priority WhatsApp messaging.",
        }
    elif risk_level == "medium" or engagement_score >= 60:
        return {
            "channel": "email",
            "reason": "Engaged customer with medium risk responds best to detailed email breakdown.",
        }
    else:
        return {
            "channel": "sms",
            "reason": "Direct SMS nudge with concise payment link for immediate low-friction resolution.",
        }


def generate_message_with_gemini(
    customer_name: str,
    amount: float,
    currency: str = "INR",
    tone: str = "professional",
    event_type: str = "payment_failed",
    payment_link: str = "",
) -> str:
    """
    Uses Gemini to generate personalized outreach messages across 4 tones with fallback.
    """
    tone = tone.lower()
    if _init_gemini():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = f"""
You are RecoverAI, an empathetic revenue recovery agent.
Write a concise, friendly, personalized notification to win back a payment.

Recipient: {customer_name}
Amount: {currency} {amount:,.2f}
Event Type: {event_type.replace('_', ' ')}
Tone Requested: {tone} (options: professional, friendly, hinglish, formal)
Note: Do NOT include URLs or links; the system interpolates payment links separately. Keep under 30 words.
"""
            response = model.generate_content(prompt)
            message = response.text.strip().replace('"', '')
            if message:
                suffix = f" Complete your payment securely: {payment_link}" if payment_link else " Our team will share a secure payment link shortly."
                return f"{message}{suffix}"
        except Exception:
            pass

    # High-reliability tone templates fallback
    link_suffix = f": {payment_link}" if payment_link else " — secure link pending (payment provider unreachable)"
    templates = {
        "hinglish": f"Hi {customer_name}, aapka {currency} {amount:,.2f} ka payment pending hai. Kripya is link se complete karein{link_suffix}",
        "friendly": f"Hey {customer_name}! We noticed your payment of {currency} {amount:,.2f} didn't go through. You can quickly retry it here{link_suffix}",
        "formal": f"Dear {customer_name}, this is a notification regarding your pending payment of {currency} {amount:,.2f}. Please finalize the transaction{link_suffix}",
        "professional": f"Hello {customer_name}, your recent transaction of {currency} {amount:,.2f} was unsuccessful. Please update your payment details{link_suffix}",
    }
    return templates.get(tone, templates["professional"])
