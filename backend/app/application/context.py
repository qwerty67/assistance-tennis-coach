"""Authenticated request context passed from API layer into application services."""
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.domain.enums import UserRole
from app.infrastructure.db.models import Coach, User


@dataclass
class Actor:
    user: User
    coach: Coach | None = None
    student_ids: list[uuid.UUID] = field(default_factory=list)

    @property
    def role(self) -> UserRole:
        return self.user.role

    @property
    def coach_id(self) -> uuid.UUID:
        assert self.coach is not None
        return self.coach.id

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.coach.timezone if self.coach else "Asia/Tehran")

    def today(self) -> date:
        return datetime.now(self.tz).date()
