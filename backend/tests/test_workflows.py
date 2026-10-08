from datetime import date, datetime, timedelta, timezone

from tests.conftest import API, register


def mk_student(client, h, first, phone, email=None):
    r = client.post(f"{API}/students", headers=h, json={
        "first_name": first, "last_name": "Test", "phone": phone, "email": email, "level": "intermediate", "age": 20})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def next_saturday():
    d = date.today() + timedelta(days=1)
    while d.weekday() != 5:
        d += timedelta(days=1)
    return d


def test_ali_private_term(client, coach):
    ali = mk_student(client, coach, "Ali", "09121111111", "ali@test.com")
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Private Ali", "class_type": "private", "duration_minutes": 60,
        "session_price": 1_000_000, "court_cost": 300_000}).json()
    assert cls["coach_income"] == 700_000 and cls["capacity_max"] == 1
    start = next_saturday()
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "ترم ۱۰ جلسه‌ای", "term_type": "fixed_sessions", "total_sessions": 10,
        "start_date": start.isoformat(), "payment_plan": "upfront",
        "members": [{"student_id": ali}],
        "schedule": {"schedule_type": "recurring", "slots": [
            {"weekday": 5, "start_time": "17:00", "end_time": "18:00"},
            {"weekday": 0, "start_time": "17:00", "end_time": "18:00"},
            {"weekday": 2, "start_time": "17:00", "end_time": "18:00"}]}})
    assert term.status_code == 201, term.text
    term = term.json()
    assert term["total_price"] == 10_000_000
    assert term["sessions_scheduled"] == 10

    acc = client.get(f"{API}/students/{ali}/account", headers=coach).json()
    assert acc["total_tuition"] == 10_000_000 and acc["debt"] == 10_000_000

    # partial payments 5M + 3M -> 2M remaining
    for amt in (5_000_000, 3_000_000):
        r = client.post(f"{API}/payments", headers=coach, json={
            "student_id": ali, "amount": amt, "paid_at": date.today().isoformat(), "method": "card",
            "term_id": term["id"]})
        assert r.status_code == 201, r.text
    acc = client.get(f"{API}/students/{ali}/account", headers=coach).json()
    assert acc["remaining_amount"] == 2_000_000 and acc["status"] == "partial"

    sessions = client.get(f"{API}/sessions", headers=coach, params={"class_id": cls["id"]}).json()
    s1, s2, s6 = sessions[0], sessions[1], sessions[5]
    # present -> consumed
    r = client.post(f"{API}/attendance/bulk", headers=coach, json={
        "session_id": s1["id"], "records": [{"student_id": ali, "status": "present"}]})
    assert r.status_code == 200, r.text
    # excused -> not consumed -> makeup suggested
    client.post(f"{API}/attendance", headers=coach, json={
        "session_id": s2["id"], "student_id": ali, "status": "excused", "absence_reason": "illness"})
    detail = client.get(f"{API}/sessions/{s2['id']}", headers=coach).json()
    assert detail["students"][0]["remaining_sessions"] == 9
    makeups = client.get(f"{API}/makeups", headers=coach).json()
    assert len(makeups) == 1 and makeups[0]["student_id"] == ali

    # cancel session 6 -> term suggests makeup
    r = client.post(f"{API}/sessions/{s6['id']}/cancel", headers=coach, json={"reason": "باران"})
    assert r.json()["makeup_suggestion"]
    t = client.get(f"{API}/terms/{term['id']}", headers=coach).json()
    assert t["makeup_needed"] == 1
    # create makeup
    st = datetime.fromisoformat(sessions[-1]["start_at"]) + timedelta(days=3)
    r = client.post(f"{API}/sessions/{s6['id']}/makeup", headers=coach, json={
        "start_at": st.isoformat(), "end_at": (st + timedelta(hours=1)).isoformat()})
    assert r.status_code == 201 and r.json()["is_makeup"]
    t = client.get(f"{API}/terms/{term['id']}", headers=coach).json()
    assert t["makeup_needed"] == 0

    # reschedule 17 -> 19 keeps history
    s3 = sessions[2]
    new_start = datetime.fromisoformat(s3["start_at"]) + timedelta(hours=2)
    r = client.put(f"{API}/sessions/{s3['id']}", headers=coach, json={"start_at": new_start.isoformat(), "reason": "زمین"})
    assert r.status_code == 200
    hist = client.get(f"{API}/sessions/{s3['id']}/history", headers=coach).json()
    assert hist[0]["change_type"] == "rescheduled"

    # Ali registers -> linked -> sees only his data
    hs = register(client, role="student", email="ali@test.com", phone="09121111111", first="Ali")
    dash = client.get(f"{API}/me/dashboard", headers=hs).json()
    assert dash["financial"]["debt"] == 2_000_000
    assert dash["next_session"] is not None
    assert client.get(f"{API}/students", headers=hs).status_code == 403
    assert client.get(f"{API}/financial-summary", headers=hs).status_code == 403
    notes = client.get(f"{API}/notifications", headers=hs).json()
    assert isinstance(notes, list)

    dashc = client.get(f"{API}/dashboard/coach", headers=coach).json()
    assert dashc["students"]["total"] == 1 and dashc["debtors_count"] == 1
    summ = client.get(f"{API}/financial-summary", headers=coach).json()
    assert summ["received"] == 8_000_000 and summ["outstanding"] == 2_000_000


def test_semi_private_split_and_override(client, coach):
    ids = [mk_student(client, coach, n, f"0912222222{i}") for i, n in enumerate(["A", "B", "C"])]
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Semi", "class_type": "semi_private", "capacity_min": 2, "capacity_max": 3,
        "session_price": 1_400_000, "court_cost": 300_000, "member_ids": ids}).json()
    assert cls["billing_mode"] == "split"
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "Semi term", "term_type": "fixed_sessions", "total_sessions": 8,
        "start_date": date.today().isoformat(), "payment_plan": "per_session"}).json()
    shares = sorted(m["share_per_session"] for m in term["members"])
    assert shares == [466_666, 466_667, 466_667]
    r = client.put(f"{API}/terms/{term['id']}/members/{ids[0]}/share", headers=coach, json={"share_per_session": 600_000})
    assert any(m["share_per_session"] == 600_000 and m["share_overridden"] for m in r.json()["members"])

    # per-session billing via ad-hoc session
    now = datetime.now(timezone.utc).replace(microsecond=0)
    s = client.post(f"{API}/sessions", headers=coach, json={
        "class_id": cls["id"], "term_id": term["id"], "start_at": now.isoformat(),
        "end_at": (now + timedelta(hours=1)).isoformat()}).json()
    client.post(f"{API}/attendance/bulk", headers=coach, json={"session_id": s["id"], "records": [
        {"student_id": ids[0], "status": "present"},
        {"student_id": ids[1], "status": "unexcused", "absence_reason": "miscommunication"},
        {"student_id": ids[2], "status": "unexcused", "is_chargeable": False}]})
    accs = [client.get(f"{API}/students/{i}/account", headers=coach).json() for i in ids]
    assert accs[0]["total_tuition"] == 600_000  # manual share override
    assert accs[1]["total_tuition"] > 0  # unexcused -> charged by default rule
    assert accs[2]["total_tuition"] == 0  # coach waived this unexcused absence


def test_lump_payer(client, coach):
    ids = [mk_student(client, coach, n, f"0913333333{i}") for i, n in enumerate(["X", "Y"])]
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Semi lump", "class_type": "semi_private", "capacity_min": 2, "capacity_max": 3,
        "session_price": 1_400_000, "billing_mode": "lump", "member_ids": ids}).json()
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "Lump", "term_type": "fixed_sessions", "total_sessions": 10,
        "start_date": date.today().isoformat(), "payer_student_id": ids[1]}).json()
    totals = {m["student_id"]: m["total_due"] for m in term["members"]}
    assert totals[ids[1]] == 14_000_000 and totals[ids[0]] == 0


def test_group_monthly(client, coach):
    ids = [mk_student(client, coach, f"G{i}", f"091444444{i:02d}") for i in range(5)]
    cls = client.post(f"{API}/classes", headers=coach, json={
        "name": "Group kids", "class_type": "group", "capacity_min": 3, "capacity_max": 8,
        "monthly_fee": 4_000_000, "member_ids": ids}).json()
    term = client.post(f"{API}/terms", headers=coach, json={
        "class_id": cls["id"], "title": "Monthly", "term_type": "monthly",
        "start_date": date.today().isoformat(),
        "schedule": {"slots": [{"weekday": 6, "start_time": "09:00", "end_time": "10:30"}]}}).json()
    assert term["total_price"] == 20_000_000
    client.post(f"{API}/payments", headers=coach, json={
        "student_id": ids[0], "amount": 4_000_000, "paid_at": date.today().isoformat()})
    client.post(f"{API}/payments", headers=coach, json={
        "student_id": ids[1], "amount": 1_000_000, "paid_at": date.today().isoformat()})
    charges = client.get(f"{API}/charges", headers=coach).json()
    statuses = {c["student_id"]: c["status"] for c in charges}
    assert statuses[ids[0]] == "paid" and statuses[ids[1]] == "partial"
    r = client.post(f"{API}/terms/{term['id']}/monthly-charges", headers=coach, json={"period": "1499-01"})
    assert r.json()["created"] == 5


def test_isolation_between_coaches(client, coach):
    sid = mk_student(client, coach, "Secret", "09125555555")
    other = register(client, email="c2@test.com", phone="09129999999")
    assert client.get(f"{API}/students/{sid}", headers=other).status_code == 404
    assert client.get(f"{API}/students", headers=other).json() == []


def test_auth_errors(client, coach):
    assert client.get(f"{API}/students").status_code == 401
    r = client.post(f"{API}/auth/login", json={"identifier": "۰۹۱۲۰۰۰۰۰۰۱", "password": "secret123"})
    assert r.status_code == 200  # Persian digits normalized
    r2 = client.post(f"{API}/auth/refresh", json={"refresh_token": r.json()["refresh_token"]})
    assert r2.status_code == 200
    # rotated token cannot be reused
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": r.json()["refresh_token"]}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"identifier": "coach@test.com", "password": "bad"}).status_code == 401


def test_training_plan(client, coach):
    sid = mk_student(client, coach, "T", "09126666666", "t@test.com")
    r = client.post(f"{API}/training-plans", headers=coach, json={
        "student_id": sid, "title": "Serve focus", "exercises": [
            {"category": "technical", "skill": "serve", "title": "Kick serve", "sets": 5, "repetitions": 20},
            {"category": "mental", "skill": "pre_serve_routine", "title": "Routine", "duration_minutes": 10}]})
    assert r.status_code == 201
    plan = r.json()
    hs = register(client, role="student", email="t@test.com", phone="09126666666")
    ex = plan["exercises"][0]["id"]
    r = client.patch(f"{API}/training-plans/{plan['id']}/exercises/{ex}", headers=hs, json={"status": "done", "title": "hack"})
    assert r.status_code == 200 and r.json()["progress"] == 0.5
    assert r.json()["exercises"][0]["title"] == "Kick serve"
