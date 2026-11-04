from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class TrainingRecommendation(BaseModel):
    """Training recommendation from AI"""
    area: str
    priority: str  # high, medium, low
    drill: str
    description: str
    duration: str


class PerformanceAnalysis(BaseModel):
    """Analysis for a specific aspect"""
    rating: str  # excellent, good, average, below_average, poor
    notes: str


class MatchAnalysis(BaseModel):
    """Complete match analysis from AI"""
    summary: str
    overall_rating: str
    strengths: List[str]
    weaknesses: List[str]
    key_insights: List[str]
    training_recommendations: List[TrainingRecommendation]
    serve_analysis: PerformanceAnalysis
    return_analysis: PerformanceAnalysis
    rally_analysis: PerformanceAnalysis
    mental_game: PerformanceAnalysis
    next_match_strategy: str


class AnalysisResponse(BaseModel):
    """Response from analysis endpoint"""
    success: bool
    markdown_report: Optional[str] = None
    statistics: Optional[Dict[str, Any]] = None
    match_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None
    analysis_id: Optional[int] = None  # ← اضافه شد: شناسه تحلیل ذخیره شده


class AnalysisRecord(BaseModel):
    """Schema for a stored analysis record"""
    id: int
    match_id: int
    markdown_report: str
    statistics: Optional[Dict[str, Any]] = None
    match_info: Optional[Dict[str, Any]] = None
    model_used: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    """Response for list of analyses"""
    success: bool
    analyses: List[AnalysisRecord] = []
    total: int = 0