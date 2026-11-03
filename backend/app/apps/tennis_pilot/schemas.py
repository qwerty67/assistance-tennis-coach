import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.application.schemas.common import ORMModel
from app.apps.tennis_pilot.models import MatchStatus, MatchResult

# Match Schemas
class MatchCreate(BaseModel):
    student_id: uuid.UUID
    opponent_name: str
    match_date: str # YYYY-MM-DD
    location: Optional[str] = None
    match_type: Optional[str] = "singles"
    notes: Optional[str] = None

class MatchUpdate(BaseModel):
    opponent_name: Optional[str] = None
    match_date: Optional[str] = None
    location: Optional[str] = None
    match_type: Optional[str] = None
    status: Optional[MatchStatus] = None
    sets_score: Optional[str] = None
    final_result: Optional[MatchResult] = None
    notes: Optional[str] = None
    student_games_won: Optional[int] = None
    opponent_games_won: Optional[int] = None

class MatchComplete(BaseModel):
    sets_score: str
    final_result: MatchResult

class MatchResponse(ORMModel):
    id: uuid.UUID
    coach_id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    opponent_name: str
    match_date: str
    location: Optional[str] = None
    match_type: str
    status: MatchStatus
    sets_score: Optional[str] = None
    final_result: Optional[MatchResult] = None
    notes: Optional[str] = None
    student_games_won: int
    opponent_games_won: int
    created_at: datetime

# Point Schemas
class PointCreate(BaseModel):
    set_number: Optional[int] = None
    game_number: Optional[int] = None
    game_score: Optional[str] = None
    server: Optional[str] = None
    serve_type: Optional[str] = None
    serve_result: Optional[str] = None
    return_result: Optional[str] = None
    final_stroke_player: Optional[str] = None
    final_stroke_type: Optional[str] = None
    final_stroke_direction: Optional[str] = None
    final_stroke_result: Optional[str] = None
    point_winner: str

class PointResponse(ORMModel):
    id: uuid.UUID
    match_id: uuid.UUID
    point_number: int
    set_number: Optional[int] = None
    game_number: Optional[int] = None
    game_score: Optional[str] = None
    server: Optional[str] = None
    serve_type: Optional[str] = None
    serve_result: Optional[str] = None
    return_result: Optional[str] = None
    final_stroke_player: Optional[str] = None
    final_stroke_type: Optional[str] = None
    final_stroke_direction: Optional[str] = None
    final_stroke_result: Optional[str] = None
    point_winner: str
    created_at: datetime

# Analysis Schemas
class AnalysisResponse(ORMModel):
    id: uuid.UUID
    match_id: uuid.UUID
    markdown_report: str
    statistics: Optional[Dict[str, Any]] = None
    match_info: Optional[Dict[str, Any]] = None
    model_used: Optional[str] = None
    created_at: datetime

# Student AI Match Statistics
class StudentMatchStats(BaseModel):
    total_matches: int
    completed_matches: int
    ongoing_matches: int
    total_wins: int
    total_losses: int
    win_percentage: float
    total_points_won: int
    total_points_lost: int
    total_aces: int
    total_double_faults: int
