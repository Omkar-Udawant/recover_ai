from datetime import datetime
from pydantic import BaseModel, Field

class PaymentLinkRequest(BaseModel):
    case_id: str
    amount: float = Field(gt=0, le=10_000_000)
    currency: str = Field(default="INR", min_length=3, max_length=6)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: str = Field(min_length=3, max_length=254)
    customer_phone: str = Field(min_length=7, max_length=20)

class PaymentLinkResponse(BaseModel):
    payment_link: str
    order_id: str | None = None
    amount: float
    status: str
    link_id: str
    currency: str
