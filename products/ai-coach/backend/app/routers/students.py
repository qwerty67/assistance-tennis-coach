import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.database import get_db
from app.models import Student, Match, Point
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentWithStats
from app.auth import get_current_user
from app.models.user import User

router = APIRouter()


def _get_coach_id_for_user(db: Session, user_id: str) -> Optional[str]:
    """Find coach.id associated with user.id, or fallback to user_id"""
    try:
        row = db.execute(
            text("SELECT id FROM coaches WHERE user_id = :uid"),
            {"uid": str(user_id)}
        ).fetchone()
        if row and row[0]:
            return str(row[0])
    except Exception:
        pass
    return str(user_id)


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Create a new student in the central database"""
    parts = (student.name or "").strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    coach_id = _get_coach_id_for_user(db, current_user.id) if current_user else None

    # If no coach_id yet, try to find any existing coach or default
    if not coach_id:
        try:
            row = db.execute(text("SELECT id FROM coaches LIMIT 1")).fetchone()
            if row and row[0]:
                coach_id = str(row[0])
        except Exception:
            coach_id = str(uuid.uuid4())

    db_student = Student(
        id=str(uuid.uuid4()),
        coach_id=coach_id,
        first_name=first_name,
        last_name=last_name,
        phone=student.phone,
        email=student.email,
        coach_notes=student.notes,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/", response_model=List[StudentWithStats])
def get_students(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Get students with complete statistics for current coach"""
    query = db.query(Student)
    if current_user:
        coach_id = _get_coach_id_for_user(db, current_user.id)
        if coach_id:
            # Match by coach_id or also include orphaned students if empty
            coach_students = query.filter(Student.coach_id == coach_id).offset(skip).limit(limit).all()
            if coach_students:
                students = coach_students
            else:
                students = query.offset(skip).limit(limit).all()
        else:
            students = query.offset(skip).limit(limit).all()
    else:
        students = query.offset(skip).limit(limit).all()

    result = []
    for student in students:
        matches = db.query(Match).filter(Match.student_id == student.id).all()

        total_matches = len(matches)
        completed_matches = len([m for m in matches if m.status == "completed"])
        ongoing_matches = len([m for m in matches if m.status == "ongoing"])

        total_wins = len([m for m in matches if m.final_result == "win"])
        total_losses = len([m for m in matches if m.final_result == "loss"])

        win_percentage = round((total_wins / completed_matches) * 100, 1) if completed_matches > 0 else 0.0

        total_points_won = 0
        total_points_lost = 0
        total_aces = 0
        total_double_faults = 0

        for match in matches:
            points = db.query(Point).filter(Point.match_id == match.id).all()
            for point in points:
                if point.point_winner == "student":
                    total_points_won += 1
                else:
                    total_points_lost += 1

                if point.serve_result == "ace":
                    total_aces += 1
                elif point.serve_result == "double_fault":
                    total_double_faults += 1

        avg_points = round((total_points_won + total_points_lost) / total_matches, 1) if total_matches > 0 else 0.0

        student_with_stats = StudentWithStats(
            id=str(student.id),
            name=student.name,
            phone=student.phone,
            email=student.email,
            notes=student.notes,
            created_at=student.created_at,
            updated_at=student.updated_at,
            total_matches=total_matches,
            completed_matches=completed_matches,
            ongoing_matches=ongoing_matches,
            total_wins=total_wins,
            total_losses=total_losses,
            win_percentage=win_percentage,
            total_points_won=total_points_won,
            total_points_lost=total_points_lost,
            average_points_per_match=avg_points,
            total_aces=total_aces,
            total_double_faults=total_double_faults,
        )
        result.append(student_with_stats)

    return result


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Get a single student by ID"""
    student = db.query(Student).filter(Student.id == str(student_id)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/details", response_model=StudentWithStats)
def get_student_details(student_id: str, db: Session = Depends(get_db)):
    """Get student details with complete statistics"""
    student = db.query(Student).filter(Student.id == str(student_id)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    matches = db.query(Match).filter(Match.student_id == str(student.id)).all()

    total_matches = len(matches)
    completed_matches = len([m for m in matches if m.status == "completed"])
    ongoing_matches = len([m for m in matches if m.status == "ongoing"])

    total_wins = len([m for m in matches if m.final_result == "win"])
    total_losses = len([m for m in matches if m.final_result == "loss"])

    win_percentage = round((total_wins / completed_matches) * 100, 1) if completed_matches > 0 else 0.0

    total_points_won = 0
    total_points_lost = 0
    total_aces = 0
    total_double_faults = 0

    for match in matches:
        points = db.query(Point).filter(Point.match_id == match.id).all()
        for point in points:
            if point.point_winner == "student":
                total_points_won += 1
            else:
                total_points_lost += 1

            if point.serve_result == "ace":
                total_aces += 1
            elif point.serve_result == "double_fault":
                total_double_faults += 1

    avg_points = round((total_points_won + total_points_lost) / total_matches, 1) if total_matches > 0 else 0.0

    return StudentWithStats(
        id=str(student.id),
        name=student.name,
        phone=student.phone,
        email=student.email,
        notes=student.notes,
        created_at=student.created_at,
        updated_at=student.updated_at,
        total_matches=total_matches,
        completed_matches=completed_matches,
        ongoing_matches=ongoing_matches,
        total_wins=total_wins,
        total_losses=total_losses,
        win_percentage=win_percentage,
        total_points_won=total_points_won,
        total_points_lost=total_points_lost,
        average_points_per_match=avg_points,
        total_aces=total_aces,
        total_double_faults=total_double_faults,
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student: StudentUpdate, db: Session = Depends(get_db)):
    """Update a student"""
    db_student = db.query(Student).filter(Student.id == str(student_id)).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.name is not None:
        db_student.name = student.name
    if student.phone is not None:
        db_student.phone = student.phone
    if student.email is not None:
        db_student.email = student.email
    if student.notes is not None:
        db_student.notes = student.notes

    db.commit()
    db.refresh(db_student)
    return db_student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    """Delete a student"""
    db_student = db.query(Student).filter(Student.id == str(student_id)).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(db_student)
    db.commit()
    return None
