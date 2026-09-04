import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, Integer, Numeric, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.payment import Payment
    from app.models.recovery_case import RecoveryCase
    from app.models.subscription import Subscription


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tenure_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement_score: Mapped[Decimal] = mapped_column(
        Numeric(4, 2), default=Decimal("0.0"), nullable=False
    )
    previous_successful_recoveries: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="customer", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        "Subscription", back_populates="customer", cascade="all, delete-orphan"
    )
    recovery_cases: Mapped[List["RecoveryCase"]] = relationship(
        "RecoveryCase", back_populates="customer", cascade="all, delete-orphan"
    )
