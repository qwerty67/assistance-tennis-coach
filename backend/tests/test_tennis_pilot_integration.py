import uuid
from datetime import date
from tests.conftest import API


def test_tennis_pilot_match_recording_and_ai_analysis(client, coach):
    # 1. Create a platform student
    st = client.post(f"{API}/students", headers=coach, json={
        "first_name": "Rafa", "last_name": "Nadal", "phone": "09121112233", "level": "professional"
    }).json()
    student_id = st["id"]

    # 2. Record a Match in TennisPilot under Coach & Student
    match_payload = {
        "student_id": student_id,
        "opponent_name": "Novak Djokovic",
        "match_date": date.today().isoformat(),
        "location": "Roland Garros Court Philippe-Chatrier",
        "match_type": "singles",
        "notes": "Championship match final"
    }
    r_match = client.post(f"{API}/tennis-pilot/matches", headers=coach, json=match_payload)
    assert r_match.status_code == 201
    match_data = r_match.json()
    match_id = match_data["id"]
    assert match_data["opponent_name"] == "Novak Djokovic"
    assert match_data["student_name"] == "Rafa Nadal"

    # 3. Record Point by Point
    p1 = client.post(f"{API}/tennis-pilot/matches/{match_id}/points", headers=coach, json={
        "set_number": 1,
        "game_number": 1,
        "game_score": "15-0",
        "server": "student",
        "serve_type": "first",
        "serve_result": "ace",
        "point_winner": "student"
    })
    assert p1.status_code == 201
    assert p1.json()["point_number"] == 1

    p2 = client.post(f"{API}/tennis-pilot/matches/{match_id}/points", headers=coach, json={
        "set_number": 1,
        "game_number": 1,
        "game_score": "15-15",
        "server": "student",
        "serve_type": "second",
        "serve_result": "in",
        "final_stroke_player": "opponent",
        "final_stroke_type": "forehand",
        "final_stroke_result": "winner",
        "point_winner": "opponent"
    })
    assert p2.status_code == 201
    assert p2.json()["point_number"] == 2

    # 4. Complete Match
    r_comp = client.post(f"{API}/tennis-pilot/matches/{match_id}/complete", headers=coach, json={
        "sets_score": "6-4, 7-6",
        "final_result": "win"
    })
    assert r_comp.status_code == 200
    assert r_comp.json()["status"] == "completed"
    assert r_comp.json()["final_result"] == "win"

    # 5. Trigger TennisPilot AI Analysis
    r_ai = client.post(f"{API}/tennis-pilot/matches/{match_id}/analyze", headers=coach)
    assert r_ai.status_code == 201
    ai_data = r_ai.json()
    assert "markdown_report" in ai_data
    assert "TennisPilot" in ai_data["markdown_report"]
    assert ai_data["statistics"] is not None

    # 6. Check Student Match Stats
    r_stats = client.get(f"{API}/tennis-pilot/students/{student_id}/stats", headers=coach)
    assert r_stats.status_code == 200
    stats = r_stats.json()
    assert stats["total_matches"] == 1
    assert stats["completed_matches"] == 1
    assert stats["total_wins"] == 1
    assert stats["win_percentage"] == 100.0
    assert stats["total_aces"] == 1
