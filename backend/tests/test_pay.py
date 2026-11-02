from datetime import date, datetime, timedelta, timezone
from tests.conftest import register, API


def test_pay_cases(client, coach):
    # Create student
    st = client.post(f"{API}/students", headers=coach, json={
        "first_name": "Ali", "last_name": "R", "phone": "09123888888", "level": "beginner"
    }).json()

    # Case 1: normal payment without term/class
    r1 = client.post(f"{API}/payments", headers=coach, json={
        "student_id": st["id"], "amount": 500000, "paid_at": "2026-11-01", "method": "cash",
        "term_id": None, "class_id": None
    })
    assert r1.status_code == 201
    assert r1.json()["student_name"] == "Ali R"

    # Case 2: empty strings for term_id/class_id (should be sanitized to None without 422)
    r2 = client.post(f"{API}/payments", headers=coach, json={
        "student_id": st["id"], "amount": 500000, "paid_at": "2026-11-01", "method": "card",
        "term_id": "", "class_id": ""
    })
    assert r2.status_code == 201

    # Case 3: payment with student having user_id / invite
    st_inv = client.post(f"{API}/students", headers=coach, json={
        "first_name": "Sara", "last_name": "K", "phone": "09127777777", "level": "intermediate",
        "with_invitation": True
    }).json()
    code = st_inv["invitation"]["code"]

    # Register student user
    h_stu = register(client, role="student", email="sara@test.com", phone="09127777777", first="Sara", last="K")
    client.post(f"{API}/invitations/accept", headers=h_stu, json={"code": code, "set_as_primary": True})

    # Record payment for Sara
    r3 = client.post(f"{API}/payments", headers=coach, json={
        "student_id": st_inv["id"], "amount": 750000, "paid_at": "2026-11-01", "method": "transfer"
    })
    assert r3.status_code == 201
    assert r3.json()["amount"] == 750000


def test_itemized_debts_and_standalone_sessions(client, coach):
    # 1. Create a student
    sid = client.post(f"{API}/students", headers=coach, json={
        "first_name": "Navid", "last_name": "Mohammadi", "phone": "09129990001", "level": "intermediate"
    }).json()["id"]

    # 2. Create Class A (Private Tennis) and Term on it
    cls_a = client.post(f"{API}/classes", headers=coach, json={
        "name": "Private Tennis", "class_type": "private", "duration_minutes": 60,
        "session_price": 1_000_000, "court_cost": 300_000, "color": "#059669"
    }).json()
    term_a = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls_a["id"], "title": "Term 5 Sessions", "term_type": "fixed_sessions",
        "total_sessions": 5, "start_date": date.today().isoformat(), "payment_plan": "upfront",
        "members": [{"student_id": sid}]
    }).json()
    assert term_a["total_price"] == 5_000_000

    # 3. Create Class B (Fitness Group) with monthly fee or per-session standalone
    cls_b = client.post(f"{API}/classes", headers=coach, json={
        "name": "Fitness", "class_type": "group", "duration_minutes": 60,
        "capacity_min": 2, "capacity_max": 8,
        "session_price": 500_000, "court_cost": 100_000, "color": "#2563EB",
        "member_ids": [sid]
    }).json()

    # 4. Schedule a standalone session on Class B (NO TERM!)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    s_standalone = client.post(f"{API}/sessions", headers=coach, json={
        "class_id": cls_b["id"], "term_id": None, "start_at": now.isoformat(),
        "end_at": (now + timedelta(hours=1)).isoformat()
    }).json()
    assert s_standalone["term_id"] is None

    # Take attendance for the standalone session -> should create Charge on Class B!
    att_res = client.post(f"{API}/attendance", headers=coach, json={
        "session_id": s_standalone["id"], "student_id": sid, "status": "present", "is_chargeable": True
    })
    assert att_res.status_code == 201

    # 5. Check student's account: Debts must be itemized by class!
    acc = client.get(f"{API}/students/{sid}/account", headers=coach).json()
    # Total charged = 5,000,000 (Term A) + 500,000 (Standalone session Class B) = 5,500,000
    assert acc["total_tuition"] == 5_500_000
    assert acc["debt"] == 5_500_000

    debts_by_class = acc["debts_by_class"]
    assert len(debts_by_class) == 2

    cls_a_debt = next(d for d in debts_by_class if d["class_id"] == cls_a["id"])
    assert cls_a_debt["class_name"] == "Private Tennis"
    assert cls_a_debt["debt"] == 5_000_000
    assert cls_a_debt["color"] == "#059669"

    cls_b_debt = next(d for d in debts_by_class if d["class_id"] == cls_b["id"])
    assert cls_b_debt["class_name"] == "Fitness"
    assert cls_b_debt["debt"] == 500_000
    assert cls_b_debt["color"] == "#2563EB"

    # 6. Record payment specifically for Class B
    pay_b = client.post(f"{API}/payments", headers=coach, json={
        "student_id": sid, "amount": 500_000, "paid_at": date.today().isoformat(),
        "class_id": cls_b["id"]
    })
    assert pay_b.status_code == 201

    # Check updated debts: FIFO allocates against open charges
    acc_after = client.get(f"{API}/students/{sid}/account", headers=coach).json()
    assert acc_after["paid_amount"] == 500_000
    assert acc_after["remaining_amount"] == 5_000_000
