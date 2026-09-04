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
