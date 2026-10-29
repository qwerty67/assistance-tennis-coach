import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.infrastructure.db.models import Coach, CoachStudentRelationship, Student, User
from app.infrastructure.db.session import SessionLocal

client = TestClient(app)


def test_relationships_and_invitation_flow():
    # 1. Register Coach A
    coach_a_res = client.post("/api/v1/auth/register", json={
        "first_name": "سهراب",
        "last_name": "مرادی",
        "email": "sohrab@tennis.ir",
        "phone": "09121000001",
        "password": "Password1234",
        "role": "coach"
    })
    assert coach_a_res.status_code in (200, 201)
    coach_a_token = coach_a_res.json()["access_token"]
    h_coach_a = {"Authorization": f"Bearer {coach_a_token}"}

    # 2. Register Coach B
    coach_b_res = client.post("/api/v1/auth/register", json={
        "first_name": "بهرام",
        "last_name": "راد",
        "email": "bahram@tennis.ir",
        "phone": "09121000002",
        "password": "Password1234",
        "role": "coach"
    })
    assert coach_b_res.status_code in (200, 201)
    coach_b_token = coach_b_res.json()["access_token"]
    h_coach_b = {"Authorization": f"Bearer {coach_b_token}"}

    # 3. Register Student User
    student_res = client.post("/api/v1/auth/register", json={
        "first_name": "سامان",
        "last_name": "کاظمی",
        "email": "saman@tennis.ir",
        "phone": "09121000003",
        "password": "Password1234",
        "role": "student"
    })
    assert student_res.status_code in (200, 201)
    student_token = student_res.json()["access_token"]
    h_student = {"Authorization": f"Bearer {student_token}"}

    # 4. Coach A creates a student with invitation
    st_res = client.post("/api/v1/students", headers=h_coach_a, json={
        "first_name": "سامان",
        "last_name": "کاظمی",
        "phone": "09121000003",
        "level": "intermediate",
        "with_invitation": True
    })
    assert st_res.status_code == 201
    st_data = st_res.json()
    assert st_data["invitation"] is not None
    inv_code_a = st_data["invitation"]["code"]
    assert inv_code_a.startswith("TC-")

    # 5. Preview invitation by code
    preview_res = client.get(f"/api/v1/invitations/preview?code={inv_code_a}")
    assert preview_res.status_code == 200
    assert preview_res.json()["coach_name"] == "سهراب مرادی"

    # 6. Student accepts Coach A invitation
    accept_a = client.post("/api/v1/invitations/accept", headers=h_student, json={
        "code": inv_code_a,
        "set_as_primary": True
    })
    assert accept_a.status_code == 200
    assert accept_a.json()["is_primary"] is True

    # Check student's coaches list
    my_coaches = client.get("/api/v1/me/coaches", headers=h_student)
    assert my_coaches.status_code == 200
    coaches_list = my_coaches.json()
    assert len(coaches_list) == 1
    assert coaches_list[0]["coach_name"] == "سهراب مرادی"
    assert coaches_list[0]["is_primary"] is True

    # 7. Coach B creates an invitation (generic or for student)
    inv_b_res = client.post("/api/v1/invitations", headers=h_coach_b, json={
        "channel": "manual",
        "expires_in_days": 30
    })
    assert inv_b_res.status_code == 201
    inv_code_b = inv_b_res.json()["code"]

    # Student connects to Coach B as well (multi-coach)
    accept_b = client.post("/api/v1/invitations/accept", headers=h_student, json={
        "code": inv_code_b,
        "set_as_primary": False
    })
    assert accept_b.status_code == 200

    # Student should now have 2 coaches: Coach A (primary) and Coach B
    my_coaches_2 = client.get("/api/v1/me/coaches", headers=h_student).json()
    assert len(my_coaches_2) == 2
    coach_a_info = next(c for c in my_coaches_2 if c["coach_name"] == "سهراب مرادی")
    coach_b_info = next(c for c in my_coaches_2 if c["coach_name"] == "بهرام راد")
    assert coach_a_info["is_primary"] is True
    assert coach_b_info["is_primary"] is False

    # 8. Switch active primary coach to Coach B
    switch_res = client.post(f"/api/v1/me/coaches/{coach_b_info['coach_id']}/primary", headers=h_student)
    assert switch_res.status_code == 200

    my_coaches_3 = client.get("/api/v1/me/coaches", headers=h_student).json()
    coach_a_info = next(c for c in my_coaches_3 if c["coach_name"] == "سهراب مرادی")
    coach_b_info = next(c for c in my_coaches_3 if c["coach_name"] == "بهرام راد")
    assert coach_a_info["is_primary"] is False
    assert coach_b_info["is_primary"] is True

    # 9. Disconnect Coach A: history is kept, status becomes inactive
    disc_res = client.post(f"/api/v1/me/coaches/{coach_a_info['coach_id']}/disconnect", headers=h_student)
    assert disc_res.status_code == 200

    my_coaches_4 = client.get("/api/v1/me/coaches", headers=h_student).json()
    coach_a_info = next(c for c in my_coaches_4 if c["coach_name"] == "سهراب مرادی")
    assert coach_a_info["status"] == "inactive"
