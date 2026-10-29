"""Aggregated dashboards tailored to the coach's daily workflow and the student's view."""
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.application.context import Actor
from app.application.services.finance_service import FinanceService
from app.application.services.notification_service import NotificationService
from app.application.services.session_service import SessionService
from app.application.services.student_service import StudentService
from app.application.services.training_service import TrainingService
from app.application.services.usage import remaining_sessions
from app.domain import jalali
from app.domain.enums import MakeupStatus, RelationshipStatus, SessionStatus, TermStatus
from app.infrastructure.db.models import (
    Coach, CoachStudentRelationship, FinancialAccount, MakeupSession, Student, TennisClass, Term, TermMember, TrainingSession,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def _day_bounds(self, actor: Actor, offset_days=0):
        d = actor.today() + timedelta(days=offset_days)
        start = datetime.combine(d, time.min, tzinfo=timezone.utc)
        end = datetime.combine(d, time.max, tzinfo=timezone.utc)
        return start, end

    def coach(self, actor: Actor) -> dict:
        cid = actor.coach_id
        start, end = self._day_bounds(actor)
        sessions = SessionService(self.db)
        finance = FinanceService(self.db)
        today = sessions.list(actor, start, end)
        now = datetime.now(timezone.utc)
        next_up = self.db.scalar(select(TrainingSession).where(
            TrainingSession.coach_id == cid, TrainingSession.start_at >= now,
            TrainingSession.status == SessionStatus.SCHEDULED).order_by(TrainingSession.start_at).limit(1))
        next_up = sessions.detail(actor, next_up.id) if next_up else None
        upcoming = sessions.list(actor, now, now + timedelta(days=7), include_cancelled=False)
        cancelled = sessions.list(actor, start - timedelta(days=14), end, status=SessionStatus.CANCELLED)
        terms = list(self.db.scalars(select(Term).where(
            Term.coach_id == cid, Term.status == TermStatus.ACTIVE, Term.deleted_at.is_(None))))
        low = []
        for t in terms:
            for tm in t.members:
                rem = remaining_sessions(self.db, t, tm.student_id)
                if rem is not None:
                    st = self.db.get(Student, tm.student_id)
                    low.append({"student_id": tm.student_id, "name": st.full_name if st else "",
                                "term_id": t.id, "term_title": t.title, "remaining": rem, "total": t.total_sessions})
        summary = finance.summary(actor)
        pending_makeups = self.db.scalar(select(func.count()).select_from(MakeupSession).where(
            MakeupSession.coach_id == cid, MakeupSession.status == MakeupStatus.PENDING)) or 0

        # Actionable reminders
        unmarked = [s for s in sessions.list(actor, now - timedelta(days=7), now, status=SessionStatus.SCHEDULED)
                    if s["end_at"] < now and not s.get("attendance_done")]
        reminders = []
        if unmarked:
            reminders.append({"type": "attendance_missing", "count": len(unmarked),
                              "session_ids": [str(s["id"]) for s in unmarked[:10]]})
        if pending_makeups:
            reminders.append({"type": "makeup_pending", "count": pending_makeups})
        overdue = [d for d in summary["debtors"] if d["overdue"] > 0]
        if overdue:
            reminders.append({"type": "overdue_payments", "count": len(overdue),
                              "amount": sum(d["overdue"] for d in overdue)})
        ending = [x for x in low if x["remaining"] <= 2]
        if ending:
            reminders.append({"type": "terms_ending", "count": len(ending)})

        jy, jm, jd = jalali.to_jalali(actor.today())
        return {
            "today": actor.today(), "jalali_today": [jy, jm, jd],
            "students": StudentService(self.db).count(actor),
            "classes_count": self.db.scalar(select(func.count()).select_from(TennisClass).where(
                TennisClass.coach_id == cid, TennisClass.deleted_at.is_(None), TennisClass.is_active.is_(True))) or 0,
            "today_classes": len({s["class_id"] for s in today}),
            "today_sessions": today,
            "next_session": next_up,
            "upcoming_sessions": upcoming,
            "cancelled_sessions": cancelled[:10],
            "cancelled_count": len(cancelled),
            "low_remaining": [x for x in low if x["remaining"] <= 3][:10],
            "debtors": summary["debtors"][:8],
            "debtors_count": summary["debtors_count"],
            "outstanding": summary["outstanding"],
            "recent_payments": finance.list_payments(actor, limit=6),
            "month_income": summary["month_income"],
            "monthly": summary["monthly"],
            "reminders": reminders,
            "pending_makeups": pending_makeups,
        }

    def student(self, actor: Actor) -> dict:
        sessions = SessionService(self.db)
        finance = FinanceService(self.db)
        sids = actor.student_ids
        now = datetime.now(timezone.utc)
        upcoming = sessions.list(actor, now, now + timedelta(days=30), include_cancelled=False)
        history = sessions.list(actor, now - timedelta(days=90), now)
        profiles = [self.db.get(Student, i) for i in sids]
        accounts = list(self.db.scalars(select(FinancialAccount).where(FinancialAccount.student_id.in_(sids or [None]))))
        terms = []
        sv = StudentService(self.db)
        for p in profiles:
            terms.extend(sv.term_usages(p))
        balance = sum(a.balance for a in accounts)
        status = "settled"
        if accounts:
            order = ["overdue", "debt", "partial", "credit", "settled"]
            status = min((a.status for a in accounts), key=lambda s: order.index(s) if s in order else 9)
        classes = list(self.db.scalars(select(TennisClass).join(Term, Term.class_id == TennisClass.id)
                                       .join(TermMember, TermMember.term_id == Term.id)
                                       .where(TermMember.student_id.in_(sids or [None])).distinct()))

        # Look up active coach for student from relationships
        active_coach_info = None
        if sids:
            rel = self.db.scalar(
                select(CoachStudentRelationship)
                .options(selectinload(CoachStudentRelationship.coach).selectinload(Coach.user))
                .where(
                    CoachStudentRelationship.student_id.in_(sids),
                    CoachStudentRelationship.status == RelationshipStatus.ACTIVE,
                )
                .order_by(CoachStudentRelationship.is_primary.desc(), CoachStudentRelationship.created_at.desc())
            )
            if rel and rel.coach and rel.coach.user:
                active_coach_info = {
                    "coach_id": str(rel.coach_id),
                    "coach_name": rel.coach.user.full_name,
                    "coach_bio": rel.coach.bio,
                    "coach_phone": rel.coach.user.phone,
                    "role_type": rel.role_type,
                    "is_primary": rel.is_primary,
                }
            elif profiles and profiles[0] and profiles[0].coach_id:
                coach_obj = self.db.get(Coach, profiles[0].coach_id)
                if coach_obj and coach_obj.user:
                    active_coach_info = {
                        "coach_id": str(coach_obj.id),
                        "coach_name": coach_obj.user.full_name,
                        "coach_bio": coach_obj.bio,
                        "coach_phone": coach_obj.user.phone,
                        "role_type": "main",
                        "is_primary": True,
                    }

        return {
            "profiles": [{"id": str(p.id), "full_name": p.full_name, "level": p.level.value,
                          "coach_id": str(p.coach_id)} for p in profiles],
            "active_coach": active_coach_info,
            "my_classes": [{"id": str(c.id), "name": c.name, "class_type": c.class_type.value, "color": c.color,
                            "duration_minutes": c.duration_minutes} for c in classes],
            "next_session": upcoming[0] if upcoming else None,
            "upcoming_sessions": upcoming[:10],
            "terms": terms,
            "remaining_sessions": sum(t["remaining_sessions"] or 0 for t in terms if t["status"] == "active"),
            "financial": {"balance": balance, "debt": max(0, -balance), "credit": max(0, balance),
                          "status": status, "total_charged": sum(a.total_charged for a in accounts),
                          "total_paid": sum(a.total_paid for a in accounts)},
            "recent_payments": finance.list_payments(actor, limit=10),
            "training_plans": TrainingService(self.db).list(actor)[:3],
            "session_history": list(reversed(history))[:20],
            "unread_notifications": NotificationService(self.db).unread_count(actor.user.id),
        }
