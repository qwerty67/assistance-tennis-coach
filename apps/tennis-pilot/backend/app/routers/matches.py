from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Match, Student
from app.schemas import MatchCreate, MatchUpdate, MatchComplete, MatchResponse

router = APIRouter()


@router.get("/", response_model=List[MatchResponse])
def get_matches(
        student_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 50,
        db: Session = Depends(get_db)
):
    """Get all matches with optional filters"""
    query = db.query(Match)

    if student_id:
        query = query.filter(Match.student_id == student_id)
    if status_filter:
        query = query.filter(Match.status == status_filter)
    if from_date:
        query = query.filter(Match.match_date >= from_date)
    if to_date:
        query = query.filter(Match.match_date <= to_date)

    matches = query.offset(skip).limit(limit).all()
    return matches


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(match: MatchCreate, db: Session = Depends(get_db)):
    """Create a new match"""
    # Verify student exists
    student = db.query(Student).filter(Student.id == match.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {match.student_id} not found"
        )

    db_match = Match(**match.dict())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    """Get a specific match"""
    match = db.query(Match).filter(Match.id == match_id).first()
    print(match)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )
    return match


@router.put("/{match_id}", response_model=MatchResponse)
def update_match(
        match_id: int,
        match: MatchUpdate,
        db: Session = Depends(get_db)
):
    """Update a match"""
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    update_data = match.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_match, key, value)

    db.commit()
    db.refresh(db_match)
    return db_match


@router.post("/{match_id}/complete", response_model=MatchResponse)
def complete_match(
        match_id: int,
        match_complete: MatchComplete,
        db: Session = Depends(get_db)
):
    """Mark a match as completed"""
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if not db_match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    db_match.status = "completed"
    db_match.sets_score = match_complete.sets_score
    db_match.final_result = match_complete.final_result

    db.commit()
    db.refresh(db_match)
    return db_match


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    """Delete a match and all associated points"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    db.delete(match)
    db.commit()
    return None