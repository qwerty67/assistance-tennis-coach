from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date


class StudentBase(BaseModel):
    """Base schema for student"""
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)


class StudentCreate(StudentBase):
    """Schema for creating a student"""
    pass


class StudentUpdate(BaseModel):
    """Schema for updating a student"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)


class StudentStats(BaseModel):
    """آمار کلی شاگرد"""
    total_matches: int = 0
    completed_matches: int = 0
    ongoing_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0
    win_percentage: float = 0.0
    total_points_won: int = 0
    total_points_lost: int = 0
    average_points_per_match: float = 0.0
    total_aces: int = 0
    total_double_faults: int = 0


class StudentResponse(BaseModel):
    """اطلاعات پایه شاگرد"""
    id: Union[str, int]
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentWithStats(StudentResponse):
    total_matches: int = 0
    completed_matches: int = 0
    ongoing_matches: int = 0
    total_wins: int = 0
    total_losses: int = 0
    win_percentage: float = 0.0
    total_points_won: int = 0
    total_points_lost: int = 0
    average_points_per_match: float = 0.0
    total_aces: int = 0
    total_double_faults: int = 0
