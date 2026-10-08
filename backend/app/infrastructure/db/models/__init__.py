"""Import every model so Alembic / metadata.create_all see them."""
from app.infrastructure.db.models.identity import Academy, Coach, DeviceToken, RefreshToken, User  # noqa
from app.infrastructure.db.models.students import Student  # noqa
from app.infrastructure.db.models.classes import (  # noqa
    ClassMember, MakeupSession, Schedule, ScheduleSlot, SessionChangeLog, TennisClass, Term,
    TermMember, TrainingSession,
)
from app.infrastructure.db.models.attendance import Attendance  # noqa
from app.infrastructure.db.models.finance import Charge, FinancialAccount, Payment  # noqa
from app.infrastructure.db.models.training import TrainingExercise, TrainingPlan  # noqa
from app.infrastructure.db.models.notifications import Notification  # noqa
