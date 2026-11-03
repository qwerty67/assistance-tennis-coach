import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.application.context import Actor
from app.core.exceptions import NotFoundError
from app.apps.ai_engine.models import AIInteractionLog
from app.apps.ai_engine.schemas import (
    AITrainingPlanRequest, AITrainingPlanResponse, AIWeeklyPlan, AIDrill,
    AIStudentAnalysisRequest, AIStudentAnalysisResponse
)
from app.infrastructure.db.models import Student, Attendance

class AIEngineService:
    def __init__(self, db: Session):
        self.db = db

    def generate_training_plan(self, actor: Actor, req: AITrainingPlanRequest) -> AITrainingPlanResponse:
        level_fa = {"beginner": "مبتدی", "intermediate": "متوسط", "advanced": "پیشرفته"}.get(req.level, req.level)
        weeks = []
        for w in range(1, req.duration_weeks + 1):
            drills = [
                AIDrill(
                    title="تمرین چابکی و جاگیری پا (Footwork Ladder)",
                    category="footwork",
                    duration_minutes=15,
                    reps_or_sets="3 sets",
                    description="حرکت سریع بین خطوط پایانی زمین با تمرکز بر حفظ مرکز ثقل پایین."
                ),
                AIDrill(
                    title=f"تمرین ضربه {req.goal} (Cross-court Rally)",
                    category="technique",
                    duration_minutes=30,
                    reps_or_sets="4 sets",
                    description=f"تمرکز بر کنترل عمق توپ به منطقه مشخص شده حریف متناسب با هدف {req.goal}."
                ),
                AIDrill(
                    title="بازی امتیاز تحت فشار (Pressure Points)",
                    category="match_play",
                    duration_minutes=20,
                    reps_or_sets="2 sets",
                    description="شروع رالی از وضعیت 30-30 برای افزایش تمرکز ذهنی."
                ),
            ]
            weeks.append(AIWeeklyPlan(week_number=w, theme=f"تمرکز بر {req.goal} (هفته {w})", drills=drills))

        res = AITrainingPlanResponse(
            title=f"برنامه تمرینی هوشمند تنیس - سطح {level_fa}",
            summary=f"این برنامه برای هدف «{req.goal}» در قالب {req.duration_weeks} هفته با حجم {req.sessions_per_week} جلسه در هفته طراحی شده است.",
            level=req.level,
            weeks=weeks,
            coach_tips=[
                "پیش از شروع هر جلسه، 5 دقیقه به مرور ویدیوهای تکنیکی ضربه اختصاص دهید.",
                "تمرینات را با شدت تدریجی از پایه به سمت موقعیت‌های مسابقه‌ای پیش ببرید.",
                "در انتهای هر جلسه بازخورد کیفی شاگرد را ثبت کنید."
            ],
        )

        if actor.user:
            log = AIInteractionLog(
                user_id=actor.user.id,
                prompt_type="training_plan",
                input_payload=req.model_dump(mode="json"),
                response_payload=res.model_dump(mode="json"),
            )
            self.db.add(log)
            self.db.commit()

        return res

    def analyze_student(self, actor: Actor, req: AIStudentAnalysisRequest) -> AIStudentAnalysisResponse:
        student = self.db.get(Student, req.student_id)
        if not student:
            raise NotFoundError("Student not found")

        total_att = self.db.scalar(
            select(func.count(Attendance.id)).where(Attendance.student_id == student.id)
        ) or 0
        present_count = self.db.scalar(
            select(func.count(Attendance.id)).where(Attendance.student_id == student.id, Attendance.status == "present")
        ) or 0
        rate = round((present_count / total_att * 100), 1) if total_att > 0 else 100.0

        strengths = [s.strip() for s in (student.strengths or "فورهند مطمئن, انگیزه بالا").split(",") if s.strip()]
        weaknesses = [w.strip() for w in (student.weaknesses or "سرویس دوم, تحرک بک‌هند").split(",") if w.strip()]

        res = AIStudentAnalysisResponse(
            student_id=student.id,
            student_name=student.full_name,
            total_sessions_attended=present_count,
            attendance_rate_percent=rate,
            key_strengths=strengths,
            areas_for_growth=weaknesses,
            recommended_focus=f"تقویت {weaknesses[0] if weaknesses else 'پایداری ضربات'} در تمرینات 2 هفته آینده.",
        )

        if actor.user:
            log = AIInteractionLog(
                user_id=actor.user.id,
                prompt_type="performance_analysis",
                input_payload=req.model_dump(mode="json"),
                response_payload=res.model_dump(mode="json"),
            )
            self.db.add(log)
            self.db.commit()

        return res
