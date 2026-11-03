from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PointBase(BaseModel):
    """Base schema for point"""
    match_id: int
    point_number: int
    set_number: Optional[int] = None # Field(..., ge=0)
    game_number: Optional[int] = None # Field(..., ge=0)
    game_score: str
    server: str  # 'student' or 'opponent'
    serve_type: Optional[str] = None  # 'first' or 'second'
    serve_result: Optional[str] = None  # 'ace', 'fault', 'let', 'in', 'double_fault'
    return_result: Optional[str] = None  # 'error', 'in'

    # Final stroke (simplified)
    final_stroke_player: Optional[str] = None  # 'student' or 'opponent'
    final_stroke_type: Optional[str] = None
    final_stroke_direction: Optional[str] = None
    final_stroke_result: Optional[str] = None  # 'winner', 'forced_error', 'unforced_error', 'net'

    point_winner: Optional[str] = None  # 'student' or 'opponent'


class PointCreate(PointBase):
    """Schema for creating a point"""
    pass


class PointResponse(PointBase):
    """Schema for point response"""
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True