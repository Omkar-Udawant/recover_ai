from typing import Optional
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    payment_id: Optional[str] = Field(None, description="Existing Payment UUID to process")
    case_id: Optional[str] = Field(None, description="Existing Case UUID to re-run or advance")
    customer_id: Optional[str] = Field(None, description="Customer UUID")
    amount: Optional[float] = Field(None, description="Transaction amount")
    customer_name: Optional[str] = Field(None, description="Customer full name")
    customer_email: Optional[str] = Field(None, description="Customer email")
    customer_phone: Optional[str] = Field(None, description="Customer phone")
    tone: Optional[str] = Field("professional", description="Outreach tone: professional, friendly, hinglish, formal")
    respect_policy: bool = Field(True, description="Apply refusal guardrails before acting")
    force: bool = Field(False, description="Override a policy refusal (audited)")


class AgentRunResponse(BaseModel):
    case_id: str
    payment_id: str
    risk_level: str
    recovery_probability: float
    channel: str
    channel_reason: str
    message: str
    payment_link: str
    case_status: str
    decision: str = Field("acted", description="acted | refused")
    refusal_reason: Optional[str] = Field(None, description="Policy reason code when refused")


class GenerateMessageRequest(BaseModel):
    customer_name: str
    amount: float
    currency: str = "INR"
    tone: str = "professional"
    event_type: str = "payment_failed"
    payment_link: Optional[str] = ""


class GenerateMessageResponse(BaseModel):
    message: str
    tone: str
    customer_name: str


class RetryPaymentRequest(BaseModel):
    amount: float
    currency: str = "INR"
    customer_name: Optional[str] = "Valued Customer"
    customer_email: Optional[str] = "customer@example.com"
    customer_phone: Optional[str] = "+91 9999999999"


class RetryPaymentResponse(BaseModel):
    payment_link: str
    link_id: str
    status: str
    amount: float
    currency: str


class BatchRunRequest(BaseModel):
    limit: int = Field(20, ge=1, le=100, description="Max open cases to consider, ranked by expected value")
    tone: Optional[str] = Field("professional", description="Outreach tone for acted cases")
    respect_policy: bool = Field(True, description="Apply refusal guardrails")
    dry_run: bool = Field(False, description="Evaluate policy only; persist nothing")


class BatchCaseResult(BaseModel):
    case_id: str
    decision: str
    refusal_reason: Optional[str] = None
    risk_level: Optional[str] = None
    channel: Optional[str] = None
    expected_value_inr: Optional[float] = None


class BatchRunResponse(BaseModel):
    considered: int
    acted: int
    refused: int
    refusals_by_reason: dict
    batch_at_risk_inr: float
    projected_net_inr: float
    results: list
