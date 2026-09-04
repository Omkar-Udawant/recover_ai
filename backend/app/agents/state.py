from typing import Optional, TypedDict


class RecoveryState(TypedDict):
    payment_id: str
    customer_id: str
    event_type: str
    amount: float
    currency: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    customer_phone: Optional[str]
    tenure_days: Optional[int]
    engagement_score: Optional[float]
    previous_successful_recoveries: Optional[int]
    days_overdue: Optional[int]
    failure_reason: Optional[str]
    tone: Optional[str]
    risk_level: Optional[str]
    recovery_probability: Optional[float]
    sentiment: Optional[str]
    sentiment_score: Optional[float]
    churn_risk_score: Optional[float]
    recommended_channel: Optional[str]
    recommended_discount: Optional[float]
    recommended_retry_time: Optional[str]
    expected_recovery_rate: Optional[float]
    recommendation_reason: Optional[str]
    channel: Optional[str]
    channel_reason: Optional[str]
    message: Optional[str]
    payment_link: Optional[str]
    case_id: Optional[str]
    case_status: str
    error: Optional[str]
