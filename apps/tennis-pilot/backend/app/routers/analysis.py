from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Match, Point, Student
from app.schemas.analysis import AnalysisResponse
from app.services.ai_service import ai_analyzer
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Match, Point, Student, Analysis
from app.schemas.analysis import AnalysisResponse, AnalysisRecord, AnalysisListResponse
from app.services.ai_service import ai_analyzer

router = APIRouter()


@router.post("/{match_id}/analyze", response_model=AnalysisResponse)
def analyze_match(
        match_id: int,
        db: Session = Depends(get_db)
):
    """
    Analyze a completed match using AI and SAVE to database
    """
    # بررسی مسابقه
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    if match.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match must be completed before analysis"
        )

    points = db.query(Point).filter(Point.match_id == match_id).all()

    if len(points) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough points recorded for meaningful analysis (minimum 5)"
        )

    student = db.query(Student).filter(Student.id == match.student_id).first()

    match_data = {
        "student_name": student.name if student else "بازیکن",
        "opponent_name": match.opponent_name,
        "match_date": str(match.match_date),
        "final_result": match.final_result,
        "sets_score": match.sets_score,
    }

    points_data = []
    for point in points:
        points_data.append({
            "point_number": point.point_number,
            "server": point.server,
            "serve_type": point.serve_type,
            "serve_result": point.serve_result,
            "return_result": point.return_result,
            "final_stroke_player": point.final_stroke_player,
            "final_stroke_type": point.final_stroke_type,
            "final_stroke_direction": point.final_stroke_direction,
            "final_stroke_result": point.final_stroke_result,
            "point_winner": point.point_winner,
            "point_score": point.game_score,
            "game_number": point.game_number,
            "set_number": point.set_number,
        })

    # اجرای تحلیل AI
    result = ai_analyzer.analyze_match(match_data, points_data)

    if not result["success"]:
        return AnalysisResponse(
            success=False,
            error=result.get("error", "Analysis failed"),
        )

    # ✅ ذخیره تحلیل در دیتابیس
    try:
        new_analysis = Analysis(
            match_id=match_id,
            markdown_report=result["markdown_report"],
            statistics=result["statistics"],
            match_info=result["match_info"],
            model_used=ai_analyzer.model_name,
        )
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        print(f"✅ Analysis saved to database with ID: {new_analysis.id}")

        return AnalysisResponse(
            success=True,
            markdown_report=result["markdown_report"],
            statistics=result["statistics"],
            match_info=result["match_info"],
            message="Analysis completed and saved successfully",
            analysis_id=new_analysis.id,
        )
    except Exception as e:
        print(f"❌ Failed to save analysis: {e}")
        db.rollback()
        # حتی اگر ذخیره نشد، تحلیل را برگردان
        return AnalysisResponse(
            success=True,
            markdown_report=result["markdown_report"],
            statistics=result["statistics"],
            match_info=result["match_info"],
            message="Analysis completed but failed to save",
        )

@router.get("/{match_id}/statistics")
def get_match_statistics(
        match_id: int,
        db: Session = Depends(get_db)
):
    """Get match statistics without AI analysis"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    points = db.query(Point).filter(Point.match_id == match_id).all()

    stats = ai_analyzer._calculate_statistics(
        [{"point_winner": p.point_winner, "server": p.server,
          "serve_type": p.serve_type, "serve_result": p.serve_result,
          "return_result": p.return_result,
          "final_stroke_player": p.final_stroke_player,
          "final_stroke_type": p.final_stroke_type,
          "final_stroke_direction": p.final_stroke_direction,
          "final_stroke_result": p.final_stroke_result}
         for p in points]
    )

    return {
        "success": True,
        "statistics": stats,
        "total_points": len(points),
    }

@router.get("/{match_id}/analysis/latest", response_model=AnalysisResponse)
def get_latest_analysis(
        match_id: int,
        db: Session = Depends(get_db)
):
    """
    Get the latest analysis for a match (without calling AI)
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    # دریافت آخرین تحلیل
    latest = db.query(Analysis).filter(
        Analysis.match_id == match_id
    ).order_by(Analysis.created_at.desc()).first()

    if not latest:
        return AnalysisResponse(
            success=False,
            error="No analysis found for this match",
        )

    return AnalysisResponse(
        success=True,
        markdown_report=latest.markdown_report,
        statistics=latest.statistics,
        match_info=latest.match_info,
        message="Analysis retrieved from database",
        analysis_id=latest.id,
    )

@router.get("/{match_id}/analyses", response_model=AnalysisListResponse)
def get_all_analyses(
        match_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all analyses for a match (history)
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    analyses = db.query(Analysis).filter(
        Analysis.match_id == match_id
    ).order_by(Analysis.created_at.desc()).all()

    return AnalysisListResponse(
        success=True,
        analyses=analyses,
        total=len(analyses),
    )