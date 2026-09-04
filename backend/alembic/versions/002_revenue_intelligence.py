"""revenue intelligence and payment reconciliation

Revision ID: 002_revenue_intelligence
Revises: 001_initial_schema
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_revenue_intelligence"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("organizations", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("name", sa.String(160), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_table("users", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="SET NULL")), sa.Column("email", sa.String(254), nullable=False, unique=True), sa.Column("role", sa.String(40), nullable=False, server_default="analyst"), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_table("payment_attempts", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("recovery_cases.id", ondelete="CASCADE"), nullable=False), sa.Column("razorpay_link_id", sa.String(100), nullable=False, unique=True), sa.Column("razorpay_order_id", sa.String(100)), sa.Column("amount", sa.Numeric(12, 2), nullable=False), sa.Column("currency", sa.String(6), nullable=False, server_default="INR"), sa.Column("payment_status", sa.String(30), nullable=False, server_default="created"), sa.Column("payment_reference", sa.String(100)), sa.Column("payment_time", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_payment_attempts_case_id", "payment_attempts", ["case_id"])
    op.create_table("customer_sentiment", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False), sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("recovery_cases.id", ondelete="SET NULL")), sa.Column("sentiment", sa.String(30), nullable=False), sa.Column("score", sa.Numeric(4, 3), nullable=False), sa.Column("churn_risk_score", sa.Numeric(4, 3), nullable=False), sa.Column("source_text", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_customer_sentiment_customer_id", "customer_sentiment", ["customer_id"])
    op.create_table("recommendations", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("recovery_cases.id", ondelete="CASCADE"), nullable=False), sa.Column("recommended_channel", sa.String(30), nullable=False), sa.Column("recommended_discount", sa.Numeric(5, 2), nullable=False, server_default="0"), sa.Column("recommended_retry_time", sa.DateTime(timezone=True), nullable=False), sa.Column("expected_recovery_rate", sa.Numeric(4, 3), nullable=False), sa.Column("reasoning", postgresql.JSONB(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_recommendations_case_id", "recommendations", ["case_id"])
    op.create_table("agent_executions", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("recovery_cases.id", ondelete="SET NULL")), sa.Column("workflow_version", sa.String(30), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("input_data", postgresql.JSONB(), nullable=False), sa.Column("output_data", postgresql.JSONB()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_table("copilot_messages", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("role", sa.String(20), nullable=False), sa.Column("content", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))


def downgrade() -> None:
    op.drop_table("copilot_messages"); op.drop_table("agent_executions"); op.drop_index("ix_recommendations_case_id", table_name="recommendations"); op.drop_table("recommendations"); op.drop_index("ix_customer_sentiment_customer_id", table_name="customer_sentiment"); op.drop_table("customer_sentiment"); op.drop_index("ix_payment_attempts_case_id", table_name="payment_attempts"); op.drop_table("payment_attempts"); op.drop_table("users"); op.drop_table("organizations")
