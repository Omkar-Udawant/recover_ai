"""outreach evidence metadata (template, language, cost)

Revision ID: 004_outreach_metadata
Revises: 003_dashboard_indexes
"""
from alembic import op
import sqlalchemy as sa

revision = "004_outreach_metadata"
down_revision = "003_dashboard_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("recovery_actions", sa.Column("template", sa.String(60), nullable=True))
    op.add_column("recovery_actions", sa.Column("lang", sa.String(12), nullable=True, server_default="en"))
    op.add_column("recovery_actions", sa.Column("cost_paise", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("payment_attempts", sa.Column("short_url", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("payment_attempts", "short_url")
    op.drop_column("recovery_actions", "cost_paise")
    op.drop_column("recovery_actions", "lang")
    op.drop_column("recovery_actions", "template")
