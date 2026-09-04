import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, ForeignKey, Numeric, String, func, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.payment import Payment
    from app.models.prediction import Prediction
    from app.models.recovery_action import RecoveryAction


class RecoveryCase(Base):
    __tablename__ = "recovery_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id", ondelete="SET NULL"), nullable=True
    )
    risk_level: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # low | medium | high
    recovery_probability: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
    )  # pending | contacted | link_opened | payment_attempted | recovered | lost
    assigned_channel: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # email | whatsapp | sms | voice_call
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    recovered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="recovery_cases")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="recovery_cases")
    recovery_actions: Mapped[List["RecoveryAction"]] = relationship(
        "RecoveryAction", back_populates="recovery_case", cascade="all, delete-orphan"
    )
    predictions: Mapped[List["Prediction"]] = relationship(
        "Prediction", back_populates="recovery_case", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_cases_status", "status"),
    )
