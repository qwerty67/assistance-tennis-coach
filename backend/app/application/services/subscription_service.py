from __future__ import annotations

import math
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.context import Actor
from app.application.schemas.subscription import (
    SubscribeIn,
    SubscribeResultOut,
    SubscriptionPlanOut,
    SubscriptionStatusOut,
)
from app.core.exceptions import ValidationError
from app.domain.enums import SubscriptionStatus, SubscriptionTier
from app.infrastructure.db.models.subscription import CoachSubscription
from app.infrastructure.db.types import utcnow

PLANS_CATALOG: dict[SubscriptionTier, SubscriptionPlanOut] = {
    SubscriptionTier.ONE_MONTH: SubscriptionPlanOut(
        id="1_month",
        tier=SubscriptionTier.ONE_MONTH,
        title="اشتراک ۱ ماهه",
        duration_days=30,
        duration_months=1,
        price=390_000,
        original_price=390_000,
        discount_percent=0,
        is_popular=False,
        badge="شروع سریع",
        features=[
            "مدیریت کامل شاگردان و کلاس‌ها",
            "ثبت جلسات و حضور و غیاب هوشمند",
            "ثبت امور مالی و پرداختی‌های شاگردان",
            "تقویم کاری و زمان‌بندی جلسات مربی",
            "پشتیبانی آنلاین درون‌برنامه‌ای",
        ],
    ),
    SubscriptionTier.THREE_MONTHS: SubscriptionPlanOut(
        id="3_months",
        tier=SubscriptionTier.THREE_MONTHS,
        title="اشتراک ۳ ماهه",
        duration_days=90,
        duration_months=3,
        price=990_000,
        original_price=1_170_000,
        discount_percent=15,
        is_popular=True,
        badge="محبوب‌ترین",
        features=[
            "تمام امکانات اشتراک ۱ ماهه",
            "۱۵٪ تخفیف اقتصادی نسبت به خرید ماهانه",
            "گزارش‌های پیشرفته مالی و نمودار روند درآمد",
            "سیستم یادآوری خودکار و مدیریت جلسات جبرانی",
            "پشتیبانی اختصاصی مربیان",
        ],
    ),
    SubscriptionTier.SIX_MONTHS: SubscriptionPlanOut(
        id="6_months",
        tier=SubscriptionTier.SIX_MONTHS,
        title="اشتراک ۶ ماهه",
        duration_days=180,
        duration_months=6,
        price=1_650_000,
        original_price=2_340_000,
        discount_percent=30,
        is_popular=False,
        badge="بیشترین صرفه اقتصادی",
        features=[
            "تمام امکانات نسخه حرفه‌ای",
            "۳۰٪ تخفیف ویژه (بیشترین صرفه اقتصادی)",
            "مدیریت نامحدود شاگردان و کلاس‌ها",
            "طراحی برنامه‌های تمرینی اختصاصی شاگردان",
            "اولویت پاسخگویی در پشتیبانی و دریافت امکانات جدید",
        ],
    ),
}


def _calc_days_left(expires_at: datetime, now: datetime) -> int:
    delta_seconds = (expires_at - now).total_seconds()
    if delta_seconds <= 0:
        return 0
    return max(1, math.ceil(delta_seconds / 86400))


class SubscriptionService:
    def __init__(self, db: Session):
        self.db = db

    def list_plans(self) -> list[SubscriptionPlanOut]:
        return list(PLANS_CATALOG.values())

    def get_plan(self, tier: SubscriptionTier) -> SubscriptionPlanOut:
        if tier not in PLANS_CATALOG:
            raise ValidationError(f"Plan '{tier}' does not exist", code="plan_not_found")
        return PLANS_CATALOG[tier]

    def get_current_subscription(self, actor: Actor) -> SubscriptionStatusOut:
        now = utcnow()
        stmt = (
            select(CoachSubscription)
            .where(CoachSubscription.coach_id == actor.coach_id)
            .order_by(CoachSubscription.expires_at.desc())
        )
        sub = self.db.scalars(stmt).first()
        if not sub:
            return SubscriptionStatusOut(is_active=False)

        is_active = sub.status == SubscriptionStatus.ACTIVE and sub.expires_at > now
        days_left = _calc_days_left(sub.expires_at, now) if is_active else 0
        return SubscriptionStatusOut(
            is_active=is_active,
            tier=sub.tier,
            title=sub.title,
            starts_at=sub.starts_at,
            expires_at=sub.expires_at,
            days_left=days_left,
            payment_reference=sub.payment_reference,
            status=sub.status if is_active else SubscriptionStatus.EXPIRED,
        )

    def subscribe(self, actor: Actor, data: SubscribeIn) -> SubscribeResultOut:
        plan = self.get_plan(data.plan_tier)
        now = utcnow()

        # Check if the coach currently has an active subscription to extend
        stmt = (
            select(CoachSubscription)
            .where(
                CoachSubscription.coach_id == actor.coach_id,
                CoachSubscription.status == SubscriptionStatus.ACTIVE,
                CoachSubscription.expires_at > now,
            )
            .order_by(CoachSubscription.expires_at.desc())
        )
        active_sub = self.db.scalars(stmt).first()

        if active_sub:
            starts_at = active_sub.expires_at
            expires_at = active_sub.expires_at + timedelta(days=plan.duration_days)
        else:
            starts_at = now
            expires_at = now + timedelta(days=plan.duration_days)

        ref_no = f"SUB-{uuid.uuid4().hex[:8].upper()}"
        subscription = CoachSubscription(
            coach_id=actor.coach_id,
            tier=plan.tier,
            title=plan.title,
            duration_days=plan.duration_days,
            price=plan.price,
            status=SubscriptionStatus.ACTIVE,
            starts_at=starts_at,
            expires_at=expires_at,
            payment_reference=ref_no,
            payment_method=data.payment_method,
        )
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)

        days_left = _calc_days_left(expires_at, now)
        sub_status = SubscriptionStatusOut(
            is_active=True,
            tier=subscription.tier,
            title=subscription.title,
            starts_at=subscription.starts_at,
            expires_at=subscription.expires_at,
            days_left=days_left,
            payment_reference=subscription.payment_reference,
            status=subscription.status,
        )

        return SubscribeResultOut(
            success=True,
            subscription=sub_status,
            message="اشتراک با موفقیت فعال شد.",
        )
