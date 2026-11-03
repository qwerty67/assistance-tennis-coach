import uuid
from datetime import date
from tests.conftest import register, API


def test_payment_resilience_with_deleted_or_missing_class(client, coach):
    """Verify that recording payment for legacy/deleted class does NOT crash."""
    # 1. Create a student
    st = client.post(f"{API}/students", headers=coach, json={
        "first_name": "Legacy", "last_name": "Student", "phone": "09120001122", "level": "beginner"
    }).json()
    sid = st["id"]

    # 2. Create a class
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Old Tennis Class", "class_type": "private", "duration_minutes": 60,
        "session_price": 500_000, "court_cost": 100_000
    }).json()
    cid = cls["id"]

    # 3. Add manual charge on this class
    chg = client.post(f"{API}/charges", headers=coach, json={
        "student_id": sid, "amount": 500_000, "class_id": cid, "kind": "manual"
    })
    assert chg.status_code == 201

    # 4. Soft-delete the class
    del_res = client.delete(f"{API}/classes/{cid}", headers=coach)
    assert del_res.status_code == 204

    # 5. Check debts itemization: class_id should be None (safe for client selection)
    acc = client.get(f"{API}/students/{sid}/account", headers=coach).json()
    assert acc["debt"] == 500_000
    assert len(acc["debts_by_class"]) == 1
    assert acc["debts_by_class"][0]["class_id"] is None

    # 6. Record payment even if client passed the old deleted cid (DEFENSIVE RECORD_PAYMENT)
    pay = client.post(f"{API}/payments", headers=coach, json={
        "student_id": sid,
        "amount": 500_000,
        "paid_at": date.today().isoformat(),
        "method": "cash",
        "class_id": cid  # Deleted class ID!
    })
    assert pay.status_code == 201
    assert pay.json()["amount"] == 500_000

    # 7. Check account is now settled
    acc_after = client.get(f"{API}/students/{sid}/account", headers=coach).json()
    assert acc_after["remaining_amount"] == 0
    assert acc_after["status"] == "settled"


def test_coach_wallet_and_settlement_flow(client, coach):
    """Verify coach wallet balance, bank info update and settlement request."""
    # 1. Fetch wallet
    w = client.get(f"{API}/wallet", headers=coach).json()
    assert "balance" in w
    assert "pending_settlement" in w

    # 2. Update bank info
    w_updated = client.put(f"{API}/wallet/bank-info", headers=coach, json={
        "iban": "IR120120000000001234567890",
        "bank_name": "Mellat Bank",
        "account_holder": "Coach Saman"
    }).json()
    assert w_updated["iban"] == "IR120120000000001234567890"

    # 3. Request settlement
    settle_req = client.post(f"{API}/wallet/settle", headers=coach, json={
        "amount": 100_000
    })
    # Since initial balance is 0, should reject with validation error
    assert settle_req.status_code in (400, 422)

    # 4. Check settlements list endpoint
    settlements = client.get(f"{API}/wallet/settlements", headers=coach)
    assert settlements.status_code == 200
    assert isinstance(settlements.json(), list)


def test_ai_engine_features(client, coach):
    """Verify AI engine training plan generation and student analysis."""
    # 1. Generate smart training plan
    plan_res = client.post(f"{API}/ai/generate-training-plan", headers=coach, json={
        "level": "intermediate",
        "goal": "فورهند تاپ‌اسپین و سرعت پا",
        "duration_weeks": 4,
        "sessions_per_week": 3
    })
    assert plan_res.status_code == 200
    data = plan_res.json()
    assert "weeks" in data
    assert len(data["weeks"]) == 4
    assert len(data["weeks"][0]["drills"]) > 0

    # 2. Analyze student
    st = client.post(f"{API}/students", headers=coach, json={
        "first_name": "AI", "last_name": "Analyzed", "phone": "09128889900", "level": "intermediate"
    }).json()

    analysis_res = client.post(f"{API}/ai/analyze-student", headers=coach, json={
        "student_id": st["id"]
    })
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()
    assert analysis["student_name"] == "AI Analyzed"
    assert "attendance_rate_percent" in analysis
    assert "recommended_focus" in analysis
