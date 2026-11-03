import uuid
from pydantic import BaseModel, Field

class AITrainingPlanRequest(BaseModel):
    level: str = Field(default="intermediate")  # beginner, intermediate, advanced, pro
    goal: str = Field(description="Training goal e.g. serve or footwork")
    duration_weeks: int = Field(default=4, ge=1, le=12)
    sessions_per_week: int = Field(default=3, ge=1, le=7)
    focus_areas: list[str] = Field(default_factory=list)

class AIDrill(BaseModel):
    title: str
    category: str
    duration_minutes: int
    reps_or_sets: str
    description: str

class AIWeeklyPlan(BaseModel):
    week_number: int
    theme: str
    drills: list[AIDrill]

class AITrainingPlanResponse(BaseModel):
    title: str
    summary: str
    level: str
    weeks: list[AIWeeklyPlan]
    coach_tips: list[str]

class AIStudentAnalysisRequest(BaseModel):
    student_id: uuid.UUID

class AIStudentAnalysisResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    total_sessions_attended: int
    attendance_rate_percent: float
    key_strengths: list[str]
    areas_for_growth: list[str]
    recommended_focus: str
