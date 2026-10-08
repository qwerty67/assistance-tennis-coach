import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import AbsenceReason, AttendanceStatus
from app.infrastructure.db.base import Base, SyncMixin, TimestampMixin, UUIDPkMixin
from app.infrastructure.db.models.identity import enum_col
from app.infrastructure.db.types import UTCDateTime


class Attendance(UUIDPkMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("session_id", "student_id", name="session_student"),)

    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    status: Mapped[AttendanceStatus] = mapped_column(enum_col(AttendanceStatus))
    absence_reason: Mapped[AbsenceReason | None] = mapped_column(enum_col(AbsenceReason), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_chargeable: Mapped[bool] = mapped_column(Boolean, default=True)
    charge_overridden: Mapped[bool] = mapped_column(Boolean, default=False)
    recorded_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    # Idempotency key from the mobile client (offline queue replay safety)
    client_mutation_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
