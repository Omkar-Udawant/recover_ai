from datetime import datetime, timedelta, timezone
from app.agents.state import RecoveryState

def run(state: RecoveryState) -> dict:
    probability = float(state.get("recovery_probability") or .5)
    churn = float(state.get("churn_risk_score") or .5)
    channel = state.get("channel") or ("whatsapp" if probability >= .6 else "email")
    discount = 10.0 if churn >= .7 else 5.0 if probability < .4 else 0.0
    retry_at = datetime.now(timezone.utc).replace(hour=19, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return {"recommended_channel": channel, "recommended_discount": discount, "recommended_retry_time": retry_at.isoformat(), "expected_recovery_rate": round(max(.05, probability * (1 - churn * .15)), 3), "recommendation_reason": "Evening retry aligns with observed consumer-response windows; discount is constrained by confidence and churn risk."}
