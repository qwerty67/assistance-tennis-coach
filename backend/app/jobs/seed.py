"""Seed realistic demo data.  Usage:  python -m app.jobs.seed

Demo accounts (password for all: Demo1234):
  coach   : coach@demo.ir  / 09120000000
  student : ali@demo.ir    / 09121111111
"""
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select

from app.application.context import Actor
from app.application.schemas.auth import RegisterIn
from app.application.schemas.classes import ClassCreate, ScheduleIn, SlotIn, TermCreate, TermMemberIn
from app.application.schemas.finance import ChargeCreate, PaymentCreate
from app.application.schemas.sessions import AttendanceBulkIn, AttendanceItem, CancelIn
from app.application.schemas.students import StudentCreate
from app.application.schemas.training import ExerciseIn, PlanCreate
from app.application.services.attendance_service import AttendanceService
from app.application.services.auth_service import AuthService
from app.application.services.class_service import ClassService
from app.application.services.finance_service import FinanceService
from app.application.services.session_service import SessionService
from app.application.services.student_service import StudentService
from app.application.services.term_service import TermService
from app.application.services.training_service import TrainingService
from app.infrastructure.db import models  # noqa: F401
from app.infrastructure.db.base import Base
from app.infrastructure.db.models import Coach, TrainingSession, User
from app.infrastructure.db.session import SessionLocal, engine

PWD = "Demo1234"


def run():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    if db.scalar(select(User).where(User.email == "coach@demo.ir")):
        print("Demo data already exists.")
        return
    auth = AuthService(db)
    auth.register(RegisterIn(first_name="رضا", last_name="کریمی", email="coach@demo.ir", phone="09120000000",
                             password=PWD, role="coach"))
    user = db.scalar(select(User).where(User.email == "coach@demo.ir"))
    actor = Actor(user=user, coach=db.scalar(select(Coach).where(Coach.user_id == user.id)))
    today = actor.today()

    ss = StudentService(db)
    people = [
        ("علی", "محمدی", "09121111111", "ali@demo.ir", "intermediate", 24),
        ("سارا", "احمدی", "09122222222", None, "advanced", 19),
        ("مهدی", "رضایی", "09123333333", None, "intermediate", 31),
        ("نگار", "حسینی", "09124444444", None, "beginner", 27),
        ("آرین", "کاظمی", "09125555555", None, "beginner", 11),
        ("هلیا", "نوری", "09126666666", None, "beginner", 10),
        ("پارسا", "جعفری", "09127777777", None, "beginner", 12),
        ("یاسمن", "صادقی", "09128888888", None, "beginner", 11),
        ("کیان", "مرادی", "09129999999", None, "professional", 17),
    ]
    ids = []
    for fn, ln, ph, em, lvl, age in people:
        s = ss.create(actor, StudentCreate(first_name=fn, last_name=ln, phone=ph, email=em, level=lvl, age=age,
                                           start_date=today - timedelta(days=120),
                                           strengths="فورهند قوی" if lvl != "beginner" else None,
                                           weaknesses="بک‌هند یک‌دست" if lvl != "beginner" else None,
                                           goals="شرکت در مسابقات باشگاهی" if lvl in ("advanced", "professional") else None))
        ids.append(s["id"])

    cs = ClassService(db)
    private = cs.create(actor, ClassCreate(name="خصوصی علی", class_type="private", session_price=1_000_000,
                                           court_cost=300_000, member_ids=[ids[0]], location="مجموعه انقلاب - زمین ۲"))
    semi = cs.create(actor, ClassCreate(name="نیمه‌خصوصی عصر", class_type="semi_private", capacity_min=2, capacity_max=3,
                                        session_price=1_400_000, court_cost=300_000, member_ids=ids[1:4],
                                        location="مجموعه انقلاب - زمین ۱"))
    group = cs.create(actor, ClassCreate(name="گروهی کودکان", class_type="group", capacity_min=3, capacity_max=8,
                                         duration_minutes=90, monthly_fee=4_000_000, member_ids=ids[4:8],
                                         location="باشگاه آفتاب"))
    academy = cs.create(actor, ClassCreate(name="آکادمی حرفه‌ای", class_type="academy", capacity_min=1, capacity_max=6,
                                           duration_minutes=180, session_price=2_500_000, court_cost=600_000,
                                           member_ids=[ids[8], ids[1]], location="آکادمی ملی"))

    ts = TermService(db)
    start = today - timedelta(days=12)
    odd = [SlotIn(weekday=w, start_time=time(17), end_time=time(18)) for w in (5, 0, 2)]
    even = [SlotIn(weekday=w, start_time=time(18, 30), end_time=time(19, 30)) for w in (6, 1, 3)]
    t_private = ts.create(actor, TermCreate(class_id=private["id"], title="ترم ۱۰ جلسه‌ای علی", term_type="fixed_sessions",
                                            total_sessions=10, start_date=start, payment_plan="upfront",
                                            schedule=ScheduleIn(slots=odd)))
    t_semi = ts.create(actor, TermCreate(class_id=semi["id"], title="ترم نیمه‌خصوصی پاییز", term_type="fixed_sessions",
                                         total_sessions=12, start_date=start, payment_plan="installments",
                                         installments_count=2, schedule=ScheduleIn(slots=even)))
    ts.create(actor, TermCreate(class_id=group["id"], title="شهریه ماهانه کودکان", term_type="monthly",
                                start_date=today - timedelta(days=10), end_date=today + timedelta(days=20),
                                schedule=ScheduleIn(slots=[SlotIn(weekday=w, start_time=time(9), end_time=time(10, 30))
                                                           for w in (4, 6)])))
    ts.create(actor, TermCreate(class_id=academy["id"], title="آکادمی - ۸ جلسه", term_type="fixed_sessions",
                                total_sessions=8, start_date=today - timedelta(days=5), payment_plan="per_session",
                                members=[TermMemberIn(student_id=ids[8]), TermMemberIn(student_id=ids[1])],
                                schedule=ScheduleIn(slots=[SlotIn(weekday=4, start_time=time(8), end_time=time(11))])))

    # attendance for past sessions
    att = AttendanceService(db)
    sv = SessionService(db)
    now = datetime.now(timezone.utc)
    past = db.scalars(select(TrainingSession).where(TrainingSession.coach_id == actor.coach_id,
                                                    TrainingSession.end_at < now).order_by(TrainingSession.start_at))
    for i, s in enumerate(list(past)):
        if i == 2:
            sv.cancel(actor, s.id, CancelIn(reason="بارندگی"))
            continue
        students = sv.participants(s)
        recs = []
        for j, st in enumerate(students):
            status, reason = "present", None
            if (i + j) % 7 == 3:
                status, reason = "excused", "illness"
            elif (i + j) % 9 == 4:
                status, reason = "unexcused", "miscommunication"
            recs.append(AttendanceItem(student_id=st.id, status=status, absence_reason=reason))
        if recs:
            att.bulk(actor, AttendanceBulkIn(session_id=s.id, records=recs))

    fs = FinanceService(db)
    pays = [(ids[0], 6_000_000, 10, "card"), (ids[1], 2_000_000, 9, "transfer"), (ids[2], 2_800_000, 8, "cash"),
            (ids[4], 4_000_000, 7, "card"), (ids[5], 2_000_000, 6, "cash"), (ids[6], 4_000_000, 4, "transfer"),
            (ids[8], 2_500_000, 2, "card")]
    for sid, amt, ago, method in pays:
        fs.record_payment(actor, PaymentCreate(student_id=sid, amount=amt, paid_at=today - timedelta(days=ago), method=method))
    # older months for charts
    for k, amt in enumerate([38_000_000, 45_500_000, 52_000_000, 61_000_000, 57_500_000]):
        fs.record_payment(actor, PaymentCreate(student_id=ids[k % 4], amount=amt, method="transfer",
                                               paid_at=today - timedelta(days=32 * (5 - k)), description="سابقه"))
        fs.create_manual_charge(actor, ChargeCreate(student_id=ids[k % 4], amount=amt, court_cost_amount=amt * 3 // 10,
                                                    due_date=today - timedelta(days=32 * (5 - k)),
                                                    description="ترم قبلی"))

    TrainingService(db).create(actor, PlanCreate(student_id=ids[0], title="بهبود سرویس و بک‌هند", start_date=today,
                                                 end_date=today + timedelta(days=30), exercises=[
        ExerciseIn(category="technical", skill="serve", title="سرویس کیک - ۵ ست ۲۰ تایی", sets=5, repetitions=20,
                   intensity="high"),
        ExerciseIn(category="technical", skill="backhand", title="بک‌هند کراس با سبد توپ", sets=4, repetitions=25),
        ExerciseIn(category="tactical", skill="serve_plus_one", title="سرویس + ۱ به سمت فورهند", duration_minutes=20),
        ExerciseIn(category="mental", skill="pre_serve_routine", title="روتین قبل از سرویس", duration_minutes=10,
                   intensity="low", status="done"),
        ExerciseIn(category="fitness", skill="agility", title="تمرین چابکی با نردبان", sets=6, duration_minutes=15),
    ]))

    # Ali has an app account
    auth.register(RegisterIn(first_name="علی", last_name="محمدی", email="ali@demo.ir", phone="09121111111",
                             password=PWD, role="student"))
    db.close()
    print("Demo data created.\n  coach  : coach@demo.ir / Demo1234\n  student: ali@demo.ir / Demo1234")


if __name__ == "__main__":
    run()
