"""dashboard performance indexes

Revision ID: 003_dashboard_indexes
Revises: 002_revenue_intelligence
"""
from alembic import op

revision = "003_dashboard_indexes"
down_revision = "002_revenue_intelligence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_recovery_cases_created_at", "recovery_cases", ["created_at"])
    op.create_index("ix_recovery_cases_risk_level", "recovery_cases", ["risk_level"])
    op.create_index("ix_recovery_cases_assigned_channel", "recovery_cases", ["assigned_channel"])
    op.create_index("ix_recovery_cases_recovered_at", "recovery_cases", ["recovered_at"])
    op.create_index("ix_payments_failure_reason", "payments", ["failure_reason"])
    op.create_index("ix_payments_customer_id", "payments", ["customer_id"])
    op.create_index("ix_payment_attempts_status", "payment_attempts", ["payment_status"])
    op.create_index("ix_customer_sentiment_case_id", "customer_sentiment", ["case_id"])


def downgrade() -> None:
    op.drop_index("ix_customer_sentiment_case_id", table_name="customer_sentiment")
    op.drop_index("ix_payment_attempts_status", table_name="payment_attempts")
    op.drop_index("ix_payments_customer_id", table_name="payments")
    op.drop_index("ix_payments_failure_reason", table_name="payments")
    op.drop_index("ix_recovery_cases_recovered_at", table_name="recovery_cases")
    op.drop_index("ix_recovery_cases_assigned_channel", table_name="recovery_cases")
    op.drop_index("ix_recovery_cases_risk_level", table_name="recovery_cases")
    op.drop_index("ix_recovery_cases_created_at", table_name="recovery_cases")
