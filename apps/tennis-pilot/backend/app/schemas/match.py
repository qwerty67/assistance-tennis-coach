from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class MatchBase(BaseModel):
    """Base schema for match"""
    student_id: int
    opponent_name: str = Field(..., min_length=1, max_length=100)
    match_date: date
    location: Optional[str] = Field(None, max_length=200)
    match_type: str = Field(default="singles")
    notes: Optional[str] = Field(None, max_length=500)


class MatchCreate(MatchBase):
    """Schema for creating a match"""
    pass


class MatchUpdate(BaseModel):
    """Schema for updating a match"""
    opponent_name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)


class MatchComplete(BaseModel):
    """Schema for completing a match"""
    sets_score: str
    final_result: str  # 'win' or 'loss'


class MatchResponse(MatchBase):
    """Schema for match response"""
    id: int
    status: str
    student_games_won: int
    opponent_games_won: int
    sets_score: Optional[str]
    final_result: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    student_games_won: Optional[int] = 0  # ✅ Optional شد
    opponent_games_won: Optional[int] = 0  # ✅ Optional شد
    class Config:
        from_attributes = True