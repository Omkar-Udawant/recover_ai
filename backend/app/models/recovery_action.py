import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, String, Text, func, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.recovery_case import RecoveryCase


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recovery_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    channel: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    message_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action_status: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # sent | opened | clicked | paid | failed
    template: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    lang: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    cost_paise: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    recovery_case: Mapped[Optional["RecoveryCase"]] = relationship(
        "RecoveryCase", back_populates="recovery_actions"
    )

    __table_args__ = (
        Index("idx_actions_case", "case_id"),
    )
