import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.recovery_case import RecoveryCase


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(6), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # success | failed | abandoned | overdue
    failure_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    event_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # payment_failed | checkout_abandoned | invoice_overdue | subscription_failed
    days_overdue: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="payments")
    recovery_cases: Mapped[List["RecoveryCase"]] = relationship(
        "RecoveryCase", back_populates="payment"
    )

    __table_args__ = (
        Index("idx_payments_status", "status"),
    )
