from datetime import datetime, timezone
import pytest
from tests.conftest import API, register


def test_list_subscription_plans(client):
    r = client.get(f"{API}/subscriptions/plans")
    assert r.status_code == 200
    plans = r.json()
    assert len(plans) == 3
    tiers = [p["tier"] for p in plans]
    assert "1_month" in tiers
    assert "3_months" in tiers
    assert "6_months" in tiers

    # check 1 month
    p1 = next(p for p in plans if p["tier"] == "1_month")
    assert p1["duration_days"] == 30
    assert p1["price"] > 0
    assert len(p1["features"]) > 0

    # check 3 months (popular)
    p3 = next(p for p in plans if p["tier"] == "3_months")
    assert p3["duration_days"] == 90
    assert p3["is_popular"] is True
    assert p3["discount_percent"] == 15

    # check 6 months
    p6 = next(p for p in plans if p["tier"] == "6_months")
    assert p6["duration_days"] == 180
    assert p6["discount_percent"] == 30


def test_coach_subscription_lifecycle(client, coach):
    # 1. New coach has no active subscription
    r = client.get(f"{API}/subscriptions/current", headers=coach)
    assert r.status_code == 200
    data = r.json()
    assert data["is_active"] is False

    # Check /auth/me
    me = client.get(f"{API}/auth/me", headers=coach).json()
    assert me["has_active_subscription"] is False
    assert me["subscription_expires_at"] is None

    # 2. Subscribe to 1-month plan
    sub_res = client.post(
        f"{API}/subscriptions/subscribe",
        headers=coach,
        json={"plan_tier": "1_month", "payment_method": "mock_gateway"},
    )
    assert sub_res.status_code == 201, sub_res.text
    res_data = sub_res.json()
    assert res_data["success"] is True
    sub = res_data["subscription"]
    assert sub["is_active"] is True
    assert sub["tier"] == "1_month"
    assert sub["days_left"] == 30
    assert sub["payment_reference"].startswith("SUB-")

    # 3. Current subscription check
    curr = client.get(f"{API}/subscriptions/current", headers=coach).json()
    assert curr["is_active"] is True
    assert curr["tier"] == "1_month"
    exp1 = datetime.fromisoformat(curr["expires_at"])

    # Check /auth/me again
    me2 = client.get(f"{API}/auth/me", headers=coach).json()
    assert me2["has_active_subscription"] is True
    assert me2["subscription_expires_at"] is not None

    # 4. Extend subscription by adding 3 months (90 days)
    ext_res = client.post(
        f"{API}/subscriptions/subscribe",
        headers=coach,
        json={"plan_tier": "3_months", "payment_method": "mock_gateway"},
    )
    assert ext_res.status_code == 201
    ext_sub = ext_res.json()["subscription"]
    assert ext_sub["is_active"] is True
    assert ext_sub["tier"] == "3_months"
    exp2 = datetime.fromisoformat(ext_sub["expires_at"])
    # Expiration extended by 90 days
    delta_days = (exp2 - exp1).days
    assert delta_days == 90
    assert ext_sub["days_left"] >= 119


def test_student_cannot_subscribe(client):
    student = register(client, role="student", email="student_sub@test.com", phone="09129998877")
    r = client.get(f"{API}/subscriptions/current", headers=student)
    assert r.status_code == 403

    r2 = client.post(
        f"{API}/subscriptions/subscribe",
        headers=student,
        json={"plan_tier": "1_month"},
    )
    assert r2.status_code == 403
