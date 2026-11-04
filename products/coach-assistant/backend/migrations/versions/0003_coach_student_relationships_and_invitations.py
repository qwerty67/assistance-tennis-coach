"""coach student relationships and invitations

Revision ID: e49c123f890a
Revises: bc89d21e01f2
Create Date: 2026-10-28 14:00:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e49c123f890a'
down_revision: Union[str, Sequence[str], None] = 'bc89d21e01f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'coach_student_relationships',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('student_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'rejected', 'inactive', name='relationshipstatus', native_enum=False, length=32), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, default=False),
        sa.Column('role_type', sa.String(length=50), nullable=False, default='main'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('invited_at', sa.DateTime(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('deactivated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], name=op.f('fk_coach_student_relationships_coach_id_coaches'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], name=op.f('fk_coach_student_relationships_student_id_students'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_coach_student_relationships')),
        sa.UniqueConstraint('coach_id', 'student_id', name='uq_coach_student_rel')
    )
    op.create_index(op.f('ix_coach_student_relationships_coach_id'), 'coach_student_relationships', ['coach_id'], unique=False)
    op.create_index(op.f('ix_coach_student_relationships_student_id'), 'coach_student_relationships', ['student_id'], unique=False)
    op.create_index(op.f('ix_coach_student_relationships_status'), 'coach_student_relationships', ['status'], unique=False)
    op.create_index(op.f('ix_coach_student_relationships_is_primary'), 'coach_student_relationships', ['is_primary'], unique=False)
    op.create_index('ix_coach_student_coach_status', 'coach_student_relationships', ['coach_id', 'status'], unique=False)
    op.create_index('ix_coach_student_student_status', 'coach_student_relationships', ['student_id', 'status'], unique=False)

    op.create_table(
        'coach_invitations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('coach_id', sa.Uuid(), nullable=False),
        sa.Column('student_id', sa.Uuid(), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('code', sa.String(length=16), nullable=False),
        sa.Column('token', sa.String(length=64), nullable=False),
        sa.Column('status', sa.Enum('created', 'sent', 'used', 'expired', 'cancelled', name='invitationstatus', native_enum=False, length=32), nullable=False),
        sa.Column('channel', sa.Enum('manual', 'sms', 'bale', 'eitaa', 'telegram', name='invitationchannel', native_enum=False, length=32), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('used_by_user_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['coaches.id'], name=op.f('fk_coach_invitations_coach_id_coaches'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], name=op.f('fk_coach_invitations_student_id_students'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['used_by_user_id'], ['users.id'], name=op.f('fk_coach_invitations_used_by_user_id_users'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_coach_invitations'))
    )
    op.create_index(op.f('ix_coach_invitations_coach_id'), 'coach_invitations', ['coach_id'], unique=False)
    op.create_index(op.f('ix_coach_invitations_student_id'), 'coach_invitations', ['student_id'], unique=False)
    op.create_index(op.f('ix_coach_invitations_phone'), 'coach_invitations', ['phone'], unique=False)
    op.create_index('ix_coach_invitations_code', 'coach_invitations', ['code'], unique=True)
    op.create_index('ix_coach_invitations_token', 'coach_invitations', ['token'], unique=True)
    op.create_index('ix_coach_invitations_coach_status', 'coach_invitations', ['coach_id', 'status'], unique=False)

    # Backfill existing students into coach_student_relationships
    conn = op.get_bind()
    is_sqlite = conn.dialect.name == "sqlite"
    students_res = conn.execute(sa.text("SELECT id, coach_id, status, created_at, updated_at FROM students"))
    for row in students_res:
        uid = uuid.uuid4().hex if is_sqlite else uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO coach_student_relationships "
                "(id, coach_id, student_id, status, is_primary, role_type, created_at, updated_at) "
                "VALUES (:id, :coach_id, :student_id, :status, :is_primary, 'main', :created_at, :updated_at)"
            ),
            {
                "id": uid,
                "coach_id": row.coach_id,
                "student_id": row.id,
                "status": row.status,
                "is_primary": 1 if is_sqlite else True,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
        )


def downgrade() -> None:
    op.drop_table('coach_invitations')
    op.drop_table('coach_student_relationships')
