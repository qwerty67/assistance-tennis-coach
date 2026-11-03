from fastapi import APIRouter
from app.api.deps import CoachActor, DB
from app.apps.ai_engine.schemas import (
    AITrainingPlanRequest, AITrainingPlanResponse, AIStudentAnalysisRequest, AIStudentAnalysisResponse
)
from app.apps.ai_engine.service import AIEngineService

router = APIRouter(prefix="/ai", tags=["ai-engine"])

@router.post("/generate-training-plan", response_model=AITrainingPlanResponse)
def generate_training_plan(data: AITrainingPlanRequest, actor: CoachActor, db: DB):
    service = AIEngineService(db)
    return service.generate_training_plan(actor, data)

@router.post("/analyze-student", response_model=AIStudentAnalysisResponse)
def analyze_student(data: AIStudentAnalysisRequest, actor: CoachActor, db: DB):
    service = AIEngineService(db)
    return service.analyze_student(actor, data)
