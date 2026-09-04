from typing import Dict, Optional
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in INR")
    tenure_days: int = Field(..., ge=0, description="Customer tenure in days")
    engagement_score: float = Field(..., ge=0, le=100, description="Customer engagement score (0-100)")
    previous_successful_recoveries: int = Field(0, ge=0, description="Past successful recoveries count")
    days_overdue: int = Field(0, ge=0, description="Days overdue since transaction event")
    failure_reason: Optional[str] = Field("insufficient_funds", description="Reason for failure")
    event_type: Optional[str] = Field("payment_failed", description="Event type")


class PredictionResponse(BaseModel):
    predicted_probability: float
    risk_level: str  # low | medium | high
    recommended_channel: str
    model_version: str = "v1.0-xgb"


class ConfusionMatrix(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class MetricsResponse(BaseModel):
    model_version: str
    total_samples: int
    test_samples: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: ConfusionMatrix
    feature_importances: Dict[str, float]
