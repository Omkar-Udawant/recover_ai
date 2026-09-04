from typing import List, Optional
from pydantic import BaseModel, Field


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=2, description="Inbound customer response text")
    customer_name: Optional[str] = "Customer"
    customer_id: Optional[str] = Field(None, description="Customer UUID for persistence")
    case_id: Optional[str] = Field(None, description="Recovery case UUID for persistence")


class SentimentResponse(BaseModel):
    sentiment: str  # positive | neutral | negative | frustrated | churn_risk
    urgency: str  # low | medium | high
    churn_risk_score: float  # 0.0 - 1.0
    suggested_action: str
    summary: str


class SmartTimingRequest(BaseModel):
    channel: str = Field("whatsapp", description="Channel: email, whatsapp, sms, voice_call")
    amount: float = Field(2499.0, gt=0)
    engagement_score: float = Field(55.0, ge=0, le=100)
    case_id: Optional[str] = Field(None, description="Recovery case UUID for persistence")


class SmartTimingResponse(BaseModel):
    recommended_time_window: str
    optimal_day_of_week: str
    predicted_open_rate_pct: float
    reasoning: str


class CopilotRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Question about revenue recovery or KPIs")


class CopilotResponse(BaseModel):
    answer: str
    suggested_actions: List[str] = []
