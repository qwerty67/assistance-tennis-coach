"""Background job: send class reminders and payment-due / debt reminders.

Run periodically (e.g. every 15 minutes) with cron, systemd timer, Celery beat or APScheduler:
    python -m app.jobs.reminders
Dedupe keys guarantee each reminder is sent only once.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.application.services.notification_service import NotificationService
from app.application.services.session_service import SessionService
from app.domain.enums import NotificationType, SessionStatus
from app.infrastructure.db import models  # noqa: F401
from app.infrastructure.db.models import Coach, FinancialAccount, Student, TrainingSession
from app.infrastructure.db.session import SessionLocal


def run() -> dict:
    db = SessionLocal()
    sent = {"sessions": 0, "debts": 0}
    try:
        notifier = NotificationService(db)
        ss = SessionService(db)
        now = datetime.now(timezone.utc)
        for coach in db.scalars(select(Coach)):
            hours = (coach.settings or {}).get("reminder_hours", 3)
            upcoming = db.scalars(select(TrainingSession).where(
                TrainingSession.coach_id == coach.id, TrainingSession.deleted_at.is_(None),
                TrainingSession.status == SessionStatus.SCHEDULED,
                TrainingSession.start_at > now, TrainingSession.start_at <= now + timedelta(hours=hours)))
            for s in upcoming:
                sent["sessions"] += notifier.notify_students(
                    ss.participants(s), NotificationType.SESSION_REMINDER, "یادآوری کلاس",
                    f"{s.tennis_class.name} - {s.start_at.isoformat()}", {"session_id": str(s.id),
                                                                         "start_at": s.start_at.isoformat()},
                    dedupe_prefix=f"remind:{s.id}")
            week = now.strftime("%G-%V")
            for acc in db.scalars(select(FinancialAccount).where(FinancialAccount.coach_id == coach.id,
                                                                 FinancialAccount.overdue_amount > 0)):
                st = db.get(Student, acc.student_id)
                sent["debts"] += notifier.notify_students(
                    [st], NotificationType.DEBT_REMINDER, "یادآوری بدهی",
                    f"مبلغ سررسید گذشته: {acc.overdue_amount:,} تومان", {"amount": acc.overdue_amount},
                    dedupe_prefix=f"debt:{week}")
        db.commit()
    finally:
        db.close()
    return sent


if __name__ == "__main__":
    print(run())
