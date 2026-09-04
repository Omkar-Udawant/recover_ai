from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel


class CustomerSummary(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    tenure_days: int
    engagement_score: float
    previous_successful_recoveries: int


class PaymentSummary(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str
    status: str
    failure_reason: Optional[str] = None
    event_type: str
    days_overdue: int
    created_at: datetime


class RecoveryActionItem(BaseModel):
    id: uuid.UUID
    channel: Optional[str] = None
    message_content: Optional[str] = None
    payment_link: Optional[str] = None
    action_status: Optional[str] = None
    template: Optional[str] = None
    lang: Optional[str] = None
    cost_paise: Optional[int] = None
    created_at: datetime


class PredictionItem(BaseModel):
    id: uuid.UUID
    model_version: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    predicted_probability: Optional[float] = None
    created_at: datetime


class AuditLogItem(BaseModel):
    id: uuid.UUID
    actor: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class CaseListItem(BaseModel):
    id: uuid.UUID
    customer_id: Optional[uuid.UUID] = None
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    payment_id: Optional[uuid.UUID] = None
    amount: float
    currency: str = "INR"
    status: str
    risk_level: Optional[str] = None
    recovery_probability: Optional[float] = None
    assigned_channel: Optional[str] = None
    failure_reason: Optional[str] = None
    event_type: Optional[str] = None
    days_overdue: int = 0
    created_at: datetime
    recovered_at: Optional[datetime] = None


class CaseListResponse(BaseModel):
    items: List[CaseListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class CaseDetailResponse(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str = "INR"
    status: str
    risk_level: Optional[str] = None
    recovery_probability: Optional[float] = None
    assigned_channel: Optional[str] = None
    created_at: datetime
    recovered_at: Optional[datetime] = None
    customer: Optional[CustomerSummary] = None
    payment: Optional[PaymentSummary] = None
    actions: List[RecoveryActionItem] = []
    predictions: List[PredictionItem] = []
    audit_logs: List[AuditLogItem] = []
    intelligence: Dict[str, Any] = {}
