"""tennis pilot integration

Revision ID: b74c10a39e81
Revises: f58a71b29d01
Create Date: 2026-11-03 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b74c10a39e81'
down_revision: Union[str, Sequence[str], None] = 'f58a71b29d01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Pilot Matches
    op.create_table(
        'pilot_matches',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('student_id', sa.Uuid(), nullable=False),
        sa.Column('opponent_name', sa.String(length=100), nullable=False),
        sa.Column('match_date', sa.String(length=20), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('match_type', sa.String(length=50), nullable=False, server_default='singles'),
        sa.Column('status', sa.Enum('ongoing', 'completed', 'cancelled', name='matchstatus', native_enum=False), nullable=False, server_default='ongoing'),
        sa.Column('sets_score', sa.String(length=50), nullable=True),
        sa.Column('final_result', sa.Enum('win', 'loss', 'draw', name='matchresult', native_enum=False), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('student_games_won', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('opponent_games_won', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pilot_matches_coach', 'pilot_matches', ['coach_id'])
    op.create_index('ix_pilot_matches_student', 'pilot_matches', ['student_id'])

    # 2. Pilot Points
    op.create_table(
        'pilot_points',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('match_id', sa.Uuid(), nullable=False),
        sa.Column('point_number', sa.Integer(), nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=True),
        sa.Column('game_number', sa.Integer(), nullable=True),
        sa.Column('game_score', sa.String(length=20), nullable=True),
        sa.Column('server', sa.String(length=20), nullable=True),
        sa.Column('serve_type', sa.String(length=20), nullable=True),
        sa.Column('serve_result', sa.String(length=20), nullable=True),
        sa.Column('return_result', sa.String(length=20), nullable=True),
        sa.Column('final_stroke_player', sa.String(length=20), nullable=True),
        sa.Column('final_stroke_type', sa.String(length=50), nullable=True),
        sa.Column('final_stroke_direction', sa.String(length=50), nullable=True),
        sa.Column('final_stroke_result', sa.String(length=50), nullable=True),
        sa.Column('point_winner', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['match_id'], ['pilot_matches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pilot_points_match', 'pilot_points', ['match_id'])

    # 3. Pilot Analyses
    op.create_table(
        'pilot_analyses',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('match_id', sa.Uuid(), nullable=False),
        sa.Column('markdown_report', sa.Text(), nullable=False),
        sa.Column('statistics', sa.JSON(), nullable=True),
        sa.Column('match_info', sa.JSON(), nullable=True),
        sa.Column('model_used', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['match_id'], ['pilot_matches.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_pilot_analyses_match', 'pilot_analyses', ['match_id'])


def downgrade() -> None:
    op.drop_table('pilot_analyses')
    op.drop_table('pilot_points')
    op.drop_table('pilot_matches')
