import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.application.context import Actor
from app.application.schemas.classes import ClassCreate, ClassUpdate
from app.core.exceptions import ValidationError
from app.domain.enums import BillingMode, ClassType
from app.domain.pricing import PriceBreakdown
from app.infrastructure.db.models import ClassMember, Student, TennisClass
from app.infrastructure.db.types import utcnow
from app.infrastructure.repositories.base import Repository

DEFAULT_COLORS = {
    ClassType.PRIVATE: "#0FA968",
    ClassType.SEMI_PRIVATE: "#2F6BFF",
    ClassType.GROUP: "#F59E0B",
    ClassType.ACADEMY: "#7C5CFF",
}
DEFAULT_BILLING = {
    ClassType.PRIVATE: BillingMode.PER_STUDENT,
    ClassType.SEMI_PRIVATE: BillingMode.SPLIT,
    ClassType.GROUP: BillingMode.PER_STUDENT,
    ClassType.ACADEMY: BillingMode.PER_STUDENT,
}


def validate_capacity(ctype: ClassType, cmin: int, cmax: int) -> None:
    if cmax < cmin:
        raise ValidationError("capacity_max must be >= capacity_min", code="invalid_capacity")
    if ctype == ClassType.PRIVATE and cmax != 1:
        raise ValidationError("Private classes have exactly one student", code="invalid_capacity")
    if ctype == ClassType.SEMI_PRIVATE and cmin < 2:
        raise ValidationError("Semi-private classes need at least 2 students", code="invalid_capacity")


class ClassService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = Repository(db)

    def to_out(self, c: TennisClass) -> dict:
        d = {k: getattr(c, k) for k in (
            "id", "name", "class_type", "capacity_min", "capacity_max", "duration_minutes", "session_price",
            "court_cost", "coach_income", "monthly_fee", "billing_mode", "color", "location", "description",
            "is_active", "created_at")}
        active = [m for m in c.members if m.is_active]
        students = {s.id: s for s in self.db.scalars(select(Student).where(Student.id.in_([m.student_id for m in active])))} if active else {}
        d["members"] = [{"student_id": m.student_id, "full_name": students[m.student_id].full_name,
                         "level": students[m.student_id].level.value, "is_active": m.is_active}
                        for m in active if m.student_id in students]
        d["member_count"] = len(d["members"])
        return d

    def list(self, actor: Actor, class_type: ClassType | None = None, active: bool | None = None) -> list[dict]:
        stmt = (select(TennisClass).options(selectinload(TennisClass.members))
                .where(TennisClass.coach_id == actor.coach_id, TennisClass.deleted_at.is_(None)))
        if class_type:
            stmt = stmt.where(TennisClass.class_type == class_type)
        if active is not None:
            stmt = stmt.where(TennisClass.is_active.is_(active))
        return [self.to_out(c) for c in self.db.scalars(stmt.order_by(TennisClass.created_at.desc()))]

    def get(self, actor: Actor, class_id: uuid.UUID) -> dict:
        return self.to_out(self.repo.get_owned(TennisClass, class_id, actor.coach_id))

    def create(self, actor: Actor, data: ClassCreate) -> dict:
        cmin, cmax = data.capacity_min, data.capacity_max
        if data.class_type == ClassType.PRIVATE:
            cmin = cmax = 1
        if data.class_type == ClassType.SEMI_PRIVATE and cmin < 2:
            cmin, cmax = 2, max(cmax, 3)
        validate_capacity(data.class_type, cmin, cmax)
        price = PriceBreakdown.build(data.session_price, data.court_cost, data.coach_income)
        c = TennisClass(
            coach_id=actor.coach_id, name=data.name, class_type=data.class_type, capacity_min=cmin, capacity_max=cmax,
            duration_minutes=data.duration_minutes, session_price=price.session_price, court_cost=price.court_cost,
            coach_income=price.coach_income, monthly_fee=data.monthly_fee,
            billing_mode=data.billing_mode or DEFAULT_BILLING[data.class_type],
            color=data.color or DEFAULT_COLORS[data.class_type], location=data.location, description=data.description,
        )
        self.db.add(c)
        self.db.flush()
        for sid in data.member_ids:
            self._add_member(actor, c, sid)
        self.db.commit()
        self.db.refresh(c)
        return self.to_out(c)

    def update(self, actor: Actor, class_id: uuid.UUID, data: ClassUpdate) -> dict:
        c = self.repo.get_owned(TennisClass, class_id, actor.coach_id)
        payload = data.model_dump(exclude_unset=True)
        if {"session_price", "court_cost", "coach_income"} & payload.keys():
            sp = payload.get("session_price", c.session_price)
            cc = payload.get("court_cost", c.court_cost)
            ci = payload.get("coach_income") if "coach_income" in payload else None
            price = PriceBreakdown.build(sp, cc, ci)
            payload.update(session_price=price.session_price, court_cost=price.court_cost, coach_income=price.coach_income)
        for k, v in payload.items():
            setattr(c, k, v)
        validate_capacity(c.class_type, c.capacity_min, c.capacity_max)
        c.version += 1
        self.db.commit()
        return self.to_out(c)

    def delete(self, actor: Actor, class_id: uuid.UUID) -> None:
        c = self.repo.get_owned(TennisClass, class_id, actor.coach_id)
        c.deleted_at = utcnow()
        c.is_active = False
        self.db.commit()

    def _add_member(self, actor: Actor, c: TennisClass, student_id: uuid.UUID) -> None:
        self.repo.get_owned(Student, student_id, actor.coach_id)
        existing = self.db.scalar(select(ClassMember).where(ClassMember.class_id == c.id, ClassMember.student_id == student_id))
        active_count = sum(1 for m in c.members if m.is_active)
        if existing and existing.is_active:
            return
        if active_count >= c.capacity_max:
            raise ValidationError("Class is full", code="class_full", details={"capacity_max": c.capacity_max})
        if existing:
            existing.is_active, existing.left_at = True, None
        else:
            c.members.append(ClassMember(student_id=student_id, joined_at=actor.today()))

    def add_member(self, actor: Actor, class_id: uuid.UUID, student_id: uuid.UUID) -> dict:
        c = self.repo.get_owned(TennisClass, class_id, actor.coach_id)
        self._add_member(actor, c, student_id)
        self.db.commit()
        self.db.refresh(c)
        return self.to_out(c)

    def remove_member(self, actor: Actor, class_id: uuid.UUID, student_id: uuid.UUID) -> dict:
        c = self.repo.get_owned(TennisClass, class_id, actor.coach_id)
        for m in c.members:
            if m.student_id == student_id:
                m.is_active, m.left_at = False, actor.today()
        self.db.commit()
        return self.to_out(c)
