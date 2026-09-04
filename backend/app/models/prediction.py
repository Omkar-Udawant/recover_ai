import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Numeric, String, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.recovery_case import RecoveryCase


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recovery_cases.id", ondelete="CASCADE"), nullable=True
    )
    model_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    features: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    predicted_probability: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    recovery_case: Mapped[Optional["RecoveryCase"]] = relationship(
        "RecoveryCase", back_populates="predictions"
    )
