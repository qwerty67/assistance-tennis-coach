import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.api.deps import CoachActor, DB
from app.infrastructure.db.models import Student
from app.apps.tennis_pilot.models import PilotMatch, PilotPoint, PilotAnalysis, MatchStatus, MatchResult
from app.apps.tennis_pilot.schemas import (
    MatchCreate, MatchUpdate, MatchComplete, MatchResponse,
    PointCreate, PointResponse, AnalysisResponse, StudentMatchStats
)
from app.apps.tennis_pilot.services.ai_service import generate_ai_analysis, calculate_match_statistics

router = APIRouter(prefix="/tennis-pilot", tags=["tennis-pilot"])

# --- MATCHES ---
@router.post("/matches", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(data: MatchCreate, actor: CoachActor, db: DB):
    student = db.get(Student, data.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    m = PilotMatch(
        coach_id=actor.coach_id,
        student_id=data.student_id,
        opponent_name=data.opponent_name,
        match_date=data.match_date,
        location=data.location,
        match_type=data.match_type or "singles",
        notes=data.notes,
        status=MatchStatus.ongoing,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    m.student_name = student.full_name
    return m

@router.get("/matches", response_model=List[MatchResponse])
def get_matches(actor: CoachActor, db: DB, student_id: Optional[uuid.UUID] = None, status_filter: Optional[str] = None):
    stmt = select(PilotMatch).where(PilotMatch.coach_id == actor.coach_id)
    if student_id:
        stmt = stmt.where(PilotMatch.student_id == student_id)
    if status_filter:
        stmt = stmt.where(PilotMatch.status == status_filter)
    stmt = stmt.order_by(PilotMatch.created_at.desc())
    matches = list(db.scalars(stmt))
    for m in matches:
        if m.student:
            m.student_name = m.student.full_name
    return matches

@router.get("/matches/{match_id}", response_model=MatchResponse)
def get_match(match_id: uuid.UUID, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    if m.student:
        m.student_name = m.student.full_name
    return m

@router.put("/matches/{match_id}", response_model=MatchResponse)
def update_match(match_id: uuid.UUID, data: MatchUpdate, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    if m.student:
        m.student_name = m.student.full_name
    return m

@router.post("/matches/{match_id}/complete", response_model=MatchResponse)
def complete_match(match_id: uuid.UUID, data: MatchComplete, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    
    m.status = MatchStatus.completed
    m.sets_score = data.sets_score
    m.final_result = data.final_result
    db.commit()
    db.refresh(m)
    if m.student:
        m.student_name = m.student.full_name
    return m

@router.delete("/matches/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: uuid.UUID, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(m)
    db.commit()
    return None

# --- POINTS RECORDING ENGINE ---
@router.post("/matches/{match_id}/points", response_model=PointResponse, status_code=status.HTTP_201_CREATED)
def record_point(match_id: uuid.UUID, data: PointCreate, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")

    count = db.scalar(select(func.count(PilotPoint.id)).where(PilotPoint.match_id == match_id)) or 0
    p = PilotPoint(
        match_id=match_id,
        point_number=count + 1,
        set_number=data.set_number,
        game_number=data.game_number,
        game_score=data.game_score,
        server=data.server,
        serve_type=data.serve_type,
        serve_result=data.serve_result,
        return_result=data.return_result,
        final_stroke_player=data.final_stroke_player,
        final_stroke_type=data.final_stroke_type,
        final_stroke_direction=data.final_stroke_direction,
        final_stroke_result=data.final_stroke_result,
        point_winner=data.point_winner,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.get("/matches/{match_id}/points", response_model=List[PointResponse])
def get_points(match_id: uuid.UUID, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    return list(db.scalars(select(PilotPoint).where(PilotPoint.match_id == match_id).order_by(PilotPoint.point_number.asc())))

# --- AI ANALYSIS ENGINE ---
@router.post("/matches/{match_id}/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def run_match_analysis(match_id: uuid.UUID, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")

    points = list(db.scalars(select(PilotPoint).where(PilotPoint.match_id == match_id).order_by(PilotPoint.point_number.asc())))
    student = m.student

    # Match info payload
    match_info = {
        "student_name": student.full_name if student else "Player",
        "opponent_name": m.opponent_name,
        "match_date": m.match_date,
        "match_type": m.match_type,
        "sets_score": m.sets_score or f"{m.student_games_won}-{m.opponent_games_won}",
        "final_result": m.final_result.value if m.final_result else "ongoing",
        "location": m.location,
    }

    stats = calculate_match_statistics(points)
    report = generate_ai_analysis(match_info, stats, points)

    analysis = PilotAnalysis(
        match_id=match_id,
        markdown_report=report,
        statistics=stats,
        match_info=match_info,
        model_used="TennisPilot-Core-AI",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis

@router.get("/matches/{match_id}/analyses", response_model=List[AnalysisResponse])
def get_match_analyses(match_id: uuid.UUID, actor: CoachActor, db: DB):
    m = db.scalar(select(PilotMatch).where(PilotMatch.id == match_id, PilotMatch.coach_id == actor.coach_id))
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    return list(db.scalars(select(PilotAnalysis).where(PilotAnalysis.match_id == match_id).order_by(PilotAnalysis.created_at.desc())))

# --- STUDENT MATCH STATS (SSO & Platform Integration) ---
@router.get("/students/{student_id}/stats", response_model=StudentMatchStats)
def get_student_pilot_stats(student_id: uuid.UUID, actor: CoachActor, db: DB):
    matches = list(db.scalars(select(PilotMatch).where(PilotMatch.student_id == student_id, PilotMatch.coach_id == actor.coach_id)))
    total_m = len(matches)
    completed_m = len([m for m in matches if m.status == MatchStatus.completed])
    ongoing_m = len([m for m in matches if m.status == MatchStatus.ongoing])
    wins = len([m for m in matches if m.final_result == MatchResult.win])
    losses = len([m for m in matches if m.final_result == MatchResult.loss])
    pct = round((wins / completed_m * 100), 1) if completed_m > 0 else 0.0

    match_ids = [m.id for m in matches]
    pts = list(db.scalars(select(PilotPoint).where(PilotPoint.match_id.in_(match_ids)))) if match_ids else []
    pw = len([p for p in pts if p.point_winner == "student"])
    pl = len([p for p in pts if p.point_winner == "opponent"])
    aces = len([p for p in pts if p.serve_result == "ace"])
    dfs = len([p for p in pts if p.serve_result == "double_fault"])

    return StudentMatchStats(
        total_matches=total_m,
        completed_matches=completed_m,
        ongoing_matches=ongoing_m,
        total_wins=wins,
        total_losses=losses,
        win_percentage=pct,
        total_points_won=pw,
        total_points_lost=pl,
        total_aces=aces,
        total_double_faults=dfs,
    )
