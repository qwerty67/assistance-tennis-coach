"""modular wallet gateway and ai

Revision ID: f58a71b29d01
Revises: e49c123f890a
Create Date: 2026-11-03 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f58a71b29d01'
down_revision: Union[str, Sequence[str], None] = 'e49c123f890a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Coach Wallets
    op.create_table(
        'coach_wallets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('balance', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('pending_settlement', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('iban', sa.String(length=34), nullable=True),
        sa.Column('bank_name', sa.String(length=100), nullable=True),
        sa.Column('account_holder', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('coach_id')
    )
    op.create_index('ix_coach_wallets_coach_id', 'coach_wallets', ['coach_id'])

    # 2. Wallet Transactions
    op.create_table(
        'wallet_transactions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('wallet_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('tx_type', sa.String(length=32), nullable=False),
        sa.Column('reference_id', sa.String(length=64), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['wallet_id'], ['coach_wallets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_wallet_tx_wallet_date', 'wallet_transactions', ['wallet_id', 'created_at'])

    # 3. Settlement Requests
    op.create_table(
        'settlement_requests',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('iban', sa.String(length=34), nullable=False),
        sa.Column('account_holder', sa.String(length=150), nullable=True),
        sa.Column('tracking_code', sa.String(length=64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_settlement_coach_status', 'settlement_requests', ['coach_id', 'status'])

    # 4. Online Payment Transactions
    op.create_table(
        'online_payment_transactions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('student_id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('gateway', sa.String(length=32), nullable=False, server_default='mock'),
        sa.Column('authority', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('term_id', sa.Uuid(), nullable=True),
        sa.Column('class_id', sa.Uuid(), nullable=True),
        sa.Column('ref_id', sa.String(length=64), nullable=True),
        sa.Column('card_pan', sa.String(length=32), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['term_id'], ['terms.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('authority')
    )
    op.create_index('ix_online_pay_authority', 'online_payment_transactions', ['authority'])
    op.create_index('ix_online_pay_student', 'online_payment_transactions', ['student_id'])
    op.create_index('ix_online_pay_coach', 'online_payment_transactions', ['coach_id'])

    # 5. AI Interaction Logs
    op.create_table(
        'ai_interaction_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('prompt_type', sa.String(length=64), nullable=False),
        sa.Column('input_payload', sa.JSON(), nullable=True),
        sa.Column('response_payload', sa.JSON(), nullable=True),
        sa.Column('tokens_used', sa.BigInteger(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_log_user', 'ai_interaction_logs', ['user_id'])


def downgrade() -> None:
    op.drop_table('ai_interaction_logs')
    op.drop_table('online_payment_transactions')
    op.drop_table('settlement_requests')
    op.drop_table('wallet_transactions')
    op.drop_table('coach_wallets')
