"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Customers Table
    op.create_table(
        "customers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("tenure_days", sa.Integer(), server_default="0", nullable=False),
        sa.Column("engagement_score", sa.Numeric(precision=4, scale=2), server_default="0.0", nullable=False),
        sa.Column("previous_successful_recoveries", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_customers_email"), "customers", ["email"], unique=True)

    # 2. Payments Table
    op.create_table(
        "payments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=6), server_default="INR", nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("failure_reason", sa.String(length=100), nullable=True),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("days_overdue", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_payments_status", "payments", ["status"], unique=False)
    op.create_index(op.f("ix_payments_status"), "payments", ["status"], unique=False)

    # 3. Subscriptions Table
    op.create_table(
        "subscriptions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("plan_name", sa.String(length=80), nullable=True),
        sa.Column("mrr", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("renewal_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 4. Recovery Cases Table
    op.create_table(
        "recovery_cases",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("risk_level", sa.String(length=10), nullable=True),
        sa.Column("recovery_probability", sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("assigned_channel", sa.String(length=20), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("recovered_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["payment_id"], ["payments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_cases_status", "recovery_cases", ["status"], unique=False)
    op.create_index(op.f("ix_recovery_cases_status"), "recovery_cases", ["status"], unique=False)

    # 5. Recovery Actions Table
    op.create_table(
        "recovery_actions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("channel", sa.String(length=20), nullable=True),
        sa.Column("message_content", sa.Text(), nullable=True),
        sa.Column("payment_link", sa.String(length=255), nullable=True),
        sa.Column("action_status", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["recovery_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_actions_case", "recovery_actions", ["case_id"], unique=False)
    op.create_index(op.f("ix_recovery_actions_case_id"), "recovery_actions", ["case_id"], unique=False)

    # 6. Predictions Table
    op.create_table(
        "predictions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("model_version", sa.String(length=20), nullable=True),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("predicted_probability", sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["recovery_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # 7. Audit Logs Table
    op.create_table(
        "audit_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("actor", sa.String(length=50), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("predictions")
    op.drop_index(op.f("ix_recovery_actions_case_id"), table_name="recovery_actions")
    op.drop_index("idx_actions_case", table_name="recovery_actions")
    op.drop_table("recovery_actions")
    op.drop_index(op.f("ix_recovery_cases_status"), table_name="recovery_cases")
    op.drop_index("idx_cases_status", table_name="recovery_cases")
    op.drop_table("recovery_cases")
    op.drop_table("subscriptions")
    op.drop_index(op.f("ix_payments_status"), table_name="payments")
    op.drop_index("idx_payments_status", table_name="payments")
    op.drop_table("payments")
    op.drop_index(op.f("ix_customers_email"), table_name="customers")
    op.drop_table("customers")
