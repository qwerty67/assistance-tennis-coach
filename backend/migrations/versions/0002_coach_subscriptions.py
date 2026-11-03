"""coach subscriptions

Revision ID: bc89d21e01f2
Revises: fa2aa96fda5b
Create Date: 2026-10-11 15:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc89d21e01f2'
down_revision: Union[str, Sequence[str], None] = 'fa2aa96fda5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'coach_subscriptions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('tier', sa.Enum('1_month', '3_months', '6_months', name='subscriptiontier', native_enum=False, length=32), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('price', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.Enum('active', 'expired', 'pending', 'cancelled', name='subscriptionstatus', native_enum=False, length=32), nullable=False),
        sa.Column('starts_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('payment_reference', sa.String(length=100), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], name=op.f('fk_coach_subscriptions_coach_id_coaches'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_coach_subscriptions'))
    )
    op.create_index(op.f('ix_coach_subscriptions_coach_id'), 'coach_subscriptions', ['coach_id'], unique=False)
    op.create_index(op.f('ix_coach_subscriptions_expires_at'), 'coach_subscriptions', ['expires_at'], unique=False)
    op.create_index(op.f('ix_coach_subscriptions_status'), 'coach_subscriptions', ['status'], unique=False)
    op.create_index(op.f('ix_coach_subscriptions_updated_at'), 'coach_subscriptions', ['updated_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_coach_subscriptions_updated_at'), table_name='coach_subscriptions')
    op.drop_index(op.f('ix_coach_subscriptions_status'), table_name='coach_subscriptions')
    op.drop_index(op.f('ix_coach_subscriptions_expires_at'), table_name='coach_subscriptions')
    op.drop_index(op.f('ix_coach_subscriptions_coach_id'), table_name='coach_subscriptions')
    op.drop_table('coach_subscriptions')
