from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import datetime, date


class MatchBase(BaseModel):
    """Base schema for match"""
    student_id: Union[str, int]
    opponent_name: str = Field(..., min_length=1, max_length=100)
    match_date: Union[date, str]
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
    student_games_won: Optional[int] = 0
    opponent_games_won: Optional[int] = 0
    sets_score: Optional[str] = None
    final_result: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
