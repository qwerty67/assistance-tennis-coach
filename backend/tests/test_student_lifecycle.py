from datetime import date, timedelta
from tests.conftest import API


def mk_student(client, h, first, phone, email=None):
    r = client.post(f"{API}/students", headers=h, json={
        "first_name": first, "last_name": "Lifecycle", "phone": phone, "email": email,
        "level": "intermediate", "age": 22
    })
    assert r.status_code == 201, r.text
    return r.json()


def next_saturday():
    d = date.today() + timedelta(days=1)
    while d.weekday() != 5:
        d += timedelta(days=1)
    return d


def test_student_delete_allowed_only_without_operational_history(client, coach):
    # 1. Student with no operational history can be deleted
    s1 = mk_student(client, coach, "Pure", "09129990001")
    s1_id = s1["id"]
    assert s1.get("can_delete") is True

    # Detail check
    r = client.get(f"{API}/students/{s1_id}", headers=coach)
    assert r.status_code == 200
    assert r.json()["can_delete"] is True

    # Delete succeeds
    r_del = client.delete(f"{API}/students/{s1_id}", headers=coach)
    assert r_del.status_code == 204

    # Deleted student cannot be found
    r_get = client.get(f"{API}/students/{s1_id}", headers=coach)
    assert r_get.status_code == 404

    # 2. Student with operational history cannot be deleted
    s2 = mk_student(client, coach, "Enrolled", "09129990002")
    s2_id = s2["id"]

    # Create class
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Class for S2", "class_type": "private", "duration_minutes": 60,
        "session_price": 1_000_000, "court_cost": 300_000
    }).json()

    # Create term enrolling s2
    start = next_saturday()
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "Term S2", "term_type": "fixed_sessions", "total_sessions": 4,
        "start_date": start.isoformat(), "payment_plan": "upfront",
        "members": [{"student_id": s2_id}],
        "schedule": {"schedule_type": "recurring", "slots": [
            {"weekday": 5, "start_time": "10:00", "end_time": "11:00"}
        ]}
    })
    assert term.status_code == 201

    # Check can_delete is now False
    r_s2 = client.get(f"{API}/students/{s2_id}", headers=coach).json()
    assert r_s2["can_delete"] is False

    # Attempting delete must fail with 422 ValidationError
    r_fail_del = client.delete(f"{API}/students/{s2_id}", headers=coach)
    assert r_fail_del.status_code == 422
    err_msg = r_fail_del.json().get("error", {}).get("message", "")
    assert "امکان حذف" in err_msg or "سوابق" in err_msg


def test_student_deactivate_archives_and_reactivate_restores(client, coach):
    s = mk_student(client, coach, "Archived", "09129990003")
    s_id = s["id"]

    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Class Archive Test", "class_type": "private", "duration_minutes": 60,
        "session_price": 1_200_000, "court_cost": 400_000
    }).json()

    start = next_saturday()
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "Term Archive Test", "term_type": "fixed_sessions", "total_sessions": 2,
        "start_date": start.isoformat(), "payment_plan": "upfront",
        "members": [{"student_id": s_id}],
        "schedule": {"schedule_type": "recurring", "slots": [
            {"weekday": 5, "start_time": "14:00", "end_time": "15:00"}
        ]}
    }).json()

    # Initial check: financial summary includes this debtor
    fin_before = client.get(f"{API}/financial-summary", headers=coach).json()
    assert fin_before["outstanding"] >= 2_400_000
    assert any(d["student_id"] == s_id for d in fin_before["debtors"])

    # Initial check: dashboard debtors include s_id
    dash_before = client.get(f"{API}/dashboard/coach", headers=coach).json()
    assert any(d["student_id"] == s_id for d in dash_before["debtors"])

    # Initial check: class members include s_id
    cls_before = client.get(f"{API}/classes/{cls['id']}", headers=coach).json()
    assert any(m["student_id"] == s_id for m in cls_before["members"])

    # Initial check: upcoming sessions has this session
    sess_before = client.get(f"{API}/sessions", headers=coach).json()
    assert any(sess["class_id"] == cls["id"] for sess in sess_before)

    # NOW DEACTIVATE THE STUDENT
    r_deact = client.post(f"{API}/students/{s_id}/deactivate", headers=coach)
    assert r_deact.status_code == 200
    assert r_deact.json()["status"] == "inactive"

    # 1. Financial summary MUST hide inactive student's debt and debtors
    fin_after_deact = client.get(f"{API}/financial-summary", headers=coach).json()
    assert not any(d["student_id"] == s_id for d in fin_after_deact["debtors"])

    # 2. Dashboard MUST hide inactive student from debtors
    dash_after_deact = client.get(f"{API}/dashboard/coach", headers=coach).json()
    assert not any(d["student_id"] == s_id for d in dash_after_deact["debtors"])

    # 3. Class members list MUST hide inactive student
    cls_after_deact = client.get(f"{API}/classes/{cls['id']}", headers=coach).json()
    assert not any(m["student_id"] == s_id for m in cls_after_deact["members"])

    # 4. Scheduled sessions with no active students MUST be hidden from coach session list
    sess_after_deact = client.get(f"{API}/sessions", headers=coach).json()
    assert not any(sess["class_id"] == cls["id"] for sess in sess_after_deact)

    # NOW REACTIVATE THE STUDENT
    r_react = client.post(f"{API}/students/{s_id}/activate", headers=coach)
    assert r_react.status_code == 200
    assert r_react.json()["status"] == "active"

    # Check everything is restored:
    fin_restored = client.get(f"{API}/financial-summary", headers=coach).json()
    assert any(d["student_id"] == s_id for d in fin_restored["debtors"])

    dash_restored = client.get(f"{API}/dashboard/coach", headers=coach).json()
    assert any(d["student_id"] == s_id for d in dash_restored["debtors"])

    cls_restored = client.get(f"{API}/classes/{cls['id']}", headers=coach).json()
    assert any(m["student_id"] == s_id for m in cls_restored["members"])

    sess_restored = client.get(f"{API}/sessions", headers=coach).json()
    assert any(sess["class_id"] == cls["id"] for sess in sess_restored)
