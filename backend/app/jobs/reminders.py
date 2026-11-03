"""Background job: send class reminders (e.g. 3 hours before session) and payment-due / debt reminders.

Run periodically (e.g. every 15 minutes) with cron, systemd timer, Celery beat or APScheduler:
    python -m app.jobs.reminders
Dedupe keys guarantee each reminder is sent only once.
"""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.services.notification_service import NotificationService
from app.application.services.session_service import SessionService
from app.domain.enums import NotificationType, SessionStatus
from app.infrastructure.db import models  # noqa: F401
from app.infrastructure.db.models import Coach, FinancialAccount, Student, TrainingSession
from app.infrastructure.db.session import SessionLocal

TEHRAN_TZ = timezone(timedelta(hours=3, minutes=30))


def run_reminders(db: Session, coach_id: uuid.UUID | None = None) -> dict:
    """Dispatches 3-hour session reminders and weekly overdue debt reminders."""
    sent = {"sessions": 0, "debts": 0}
    notifier = NotificationService(db)
    ss = SessionService(db)
    now = datetime.now(timezone.utc)

    stmt = select(Coach)
    if coach_id:
        stmt = stmt.where(Coach.id == coach_id)

    for coach in db.scalars(stmt):
        hours = (coach.settings or {}).get("reminder_hours", 3)
        upcoming = list(db.scalars(
            select(TrainingSession).where(
                TrainingSession.coach_id == coach.id,
                TrainingSession.deleted_at.is_(None),
                TrainingSession.status == SessionStatus.SCHEDULED,
                TrainingSession.start_at > now,
                TrainingSession.start_at <= now + timedelta(hours=hours),
            )
        ))
        for s in upcoming:
            cname = s.tennis_class.name if s.tennis_class else "جلسه تمرین آزاد"
            local_time = s.start_at.astimezone(TEHRAN_TZ).strftime("%H:%M")
            body_text = f"جلسه تمرین «{cname}» راس ساعت {local_time} آغاز می‌شود."
            sent["sessions"] += notifier.notify_students(
                ss.participants(s),
                NotificationType.SESSION_REMINDER,
                "یادآوری کلاس تمرین",
                body_text,
                {"session_id": str(s.id), "start_at": s.start_at.isoformat()},
                dedupe_prefix=f"remind:{s.id}",
            )

        week = now.strftime("%G-%V")
        for acc in db.scalars(
            select(FinancialAccount).where(
                FinancialAccount.coach_id == coach.id,
                FinancialAccount.overdue_amount > 0,
            )
        ):
            st = db.get(Student, acc.student_id)
            if st:
                sent["debts"] += notifier.notify_students(
                    [st],
                    NotificationType.DEBT_REMINDER,
                    "یادآوری بدهی",
                    f"مبلغ سررسید گذشته: {acc.overdue_amount:,} تومان",
                    {"amount": acc.overdue_amount},
                    dedupe_prefix=f"debt:{week}",
                )

    db.flush()
    return sent


def run() -> dict:
    db = SessionLocal()
    try:
        sent = run_reminders(db)
        db.commit()
        return sent
    finally:
        db.close()


if __name__ == "__main__":
    print(run())
