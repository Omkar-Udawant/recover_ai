"""Real outbound email via SMTP (Gmail App Password for the hackathon demo).

Configure SMTP_USER + SMTP_PASS and the agent sends genuine recovery emails
containing the real Razorpay payment link. Absent credentials → honest 503,
never a fake "sent" response.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import settings


def is_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASS)


def send_recovery_email(
    *,
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
) -> dict:
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Outbound email is not configured (SMTP_USER/SMTP_PASS missing)",
        )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    if body_html:
        msg.attach(MIMEText(body_html, "html", "utf-8"))
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"SMTP delivery failed: {exc}") from exc
    return {"to": to_email, "subject": subject, "status": "sent"}


FOOTER_TEXT = (
    "\n\n—\nWhy you received this: you have an incomplete payment with us. "
    "Reply STOP to opt out of recovery reminders."
)


def build_recovery_email(customer_name: str, amount: float, currency: str, payment_link: str, tone: str) -> tuple[str, str]:
    subject = f"Payment of {currency} {amount:,.2f} could not be completed"
    greeting = {
        "hinglish": f"Hi {customer_name}, aapka {currency} {amount:,.2f} ka payment pending hai.",
        "friendly": f"Hey {customer_name}! Your payment of {currency} {amount:,.2f} didn't go through.",
        "formal": f"Dear {customer_name}, your payment of {currency} {amount:,.2f} is pending.",
    }.get(tone.lower(), f"Hello {customer_name}, your payment of {currency} {amount:,.2f} is pending.")
    link_line = f"\nComplete it securely here: {payment_link}\n" if payment_link else "\nOur team will share a secure payment link shortly.\n"
    return subject, greeting + "\n" + link_line + FOOTER_TEXT
