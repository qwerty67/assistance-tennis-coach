"""Domain enumerations. Values are stable API contract strings."""
from enum import StrEnum


class UserRole(StrEnum):
    COACH = "coach"
    STUDENT = "student"
    ADMIN = "admin"  # reserved for future academy / club management


class StudentStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class PlayerLevel(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PROFESSIONAL = "professional"


class ClassType(StrEnum):
    PRIVATE = "private"
    SEMI_PRIVATE = "semi_private"
    GROUP = "group"
    ACADEMY = "academy"


class BillingMode(StrEnum):
    """How a session price is distributed among members."""

    PER_STUDENT = "per_student"  # every member pays the full price (group / private)
    SPLIT = "split"  # total price split between members (semi-private)
    LUMP = "lump"  # a single payer pays the whole price


class TermType(StrEnum):
    FIXED_SESSIONS = "fixed_sessions"  # e.g. 10 or 20 sessions
    MONTHLY = "monthly"
    CUSTOM = "custom"


class PaymentPlan(StrEnum):
    UPFRONT = "upfront"  # before term starts
    PER_SESSION = "per_session"
    INSTALLMENTS = "installments"
    MANUAL = "manual"


class TermStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ScheduleType(StrEnum):
    RECURRING = "recurring"  # weekly slots (each weekday can have its own time)
    CUSTOM = "custom"  # explicit list of dates & times


class SessionStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SessionChangeType(StrEnum):
    CREATED = "created"
    RESCHEDULED = "rescheduled"
    UPDATED = "updated"
    CANCELLED = "cancelled"
    RESTORED = "restored"
    DELETED = "deleted"


class MakeupStatus(StrEnum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    DISMISSED = "dismissed"


class AttendanceStatus(StrEnum):
    PRESENT = "present"
    ABSENT = "absent"
    EXCUSED = "excused"
    UNEXCUSED = "unexcused"
    CANCELLED = "cancelled"
    MAKEUP = "makeup"


class AbsenceReason(StrEnum):
    ILLNESS = "illness"
    TRAVEL = "travel"
    PERSONAL = "personal"
    EXAM = "exam"
    MISCOMMUNICATION = "miscommunication"
    OTHER = "other"


class ChargeKind(StrEnum):
    TERM_FEE = "term_fee"
    SESSION_FEE = "session_fee"
    MONTHLY_FEE = "monthly_fee"
    INSTALLMENT = "installment"
    MANUAL = "manual"
    ADJUSTMENT = "adjustment"


class ChargeStatus(StrEnum):
    PAID = "paid"
    PARTIAL = "partial"
    UNPAID = "unpaid"
    OVERDUE = "overdue"


class PaymentMethod(StrEnum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"
    OTHER = "other"


class FinancialStatus(StrEnum):
    SETTLED = "settled"  # 🟢
    PARTIAL = "partial"  # 🟡
    DEBT = "debt"  # 🔴
    OVERDUE = "overdue"  # 🔴 + past due date
    CREDIT = "credit"  # prepaid / creditor


class TrainingCategory(StrEnum):
    TECHNICAL = "technical"
    TACTICAL = "tactical"
    MENTAL = "mental"
    FITNESS = "fitness"


class Intensity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    MAX = "max"


class PlanStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ExerciseStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class NotificationType(StrEnum):
    SESSION_REMINDER = "session_reminder"
    SESSION_RESCHEDULED = "session_rescheduled"
    SESSION_CREATED = "session_created"
    MAKEUP_CREATED = "makeup_created"
    SESSION_CANCELLED = "session_cancelled"
    PAYMENT_DUE = "payment_due"
    DEBT_REMINDER = "debt_reminder"
    PAYMENT_RECORDED = "payment_recorded"
    TRAINING_PLAN = "training_plan"
    GENERAL = "general"


class SubscriptionTier(StrEnum):
    ONE_MONTH = "1_month"
    THREE_MONTHS = "3_months"
    SIX_MONTHS = "6_months"


class SubscriptionStatus(StrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"
    CANCELLED = "cancelled"
