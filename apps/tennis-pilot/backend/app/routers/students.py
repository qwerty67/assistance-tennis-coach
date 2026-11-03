from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Student, Match, Point
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentWithStats, StudentStats, StudentBase
from app.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student"""
    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/", response_model=List[StudentWithStats])
def get_students(skip: int = 0, limit: int = 50, db: Session = Depends(get_db),current_user: dict = Depends(get_current_user)):
    """Get all students with complete statistics"""
    students = db.query(Student).offset(skip).limit(limit).all()

    result = []
    for student in students:
        # محاسبه آمار کامل
        matches = db.query(Match).filter(Match.student_id == student.id).all()

        total_matches = len(matches)
        completed_matches = len([m for m in matches if m.status == "completed"])
        ongoing_matches = len([m for m in matches if m.status == "ongoing"])

        total_wins = len([m for m in matches if m.final_result == "win"])
        total_losses = len([m for m in matches if m.final_result == "loss"])

        win_percentage = round((total_wins / completed_matches) * 100, 1) if completed_matches > 0 else 0.0

        # محاسبه امتیازات از طریق Point
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

        # ساخت آبجکت stats
        stats_obj = StudentStats(
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

        # ساخت پاسخ نهایی
        student_with_stats = StudentWithStats(
            id=student.id,
            name=student.name,
            phone=student.phone,
            email=student.email,
            notes=student.notes,
            created_at=student.created_at,
            updated_at=student.updated_at,
            stats=stats_obj,
        )
        result.append(student_with_stats)

    return result


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a single student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/{student_id}/details", response_model=StudentWithStats)
def get_student_details(student_id: int, db: Session = Depends(get_db)):
    """Get student details with complete statistics"""
    student = db.query(Student).filter(Student.id == student_id).first()
    print(student.name)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # محاسبه آمار (همان کد بالا)
    matches = db.query(Match).filter(Match.student_id == student.id).all()

    total_matches = len(matches)
    completed_matches = len([m for m in matches if m.status == "completed"])
    ongoing_matches = len([m for m in matches if m.status == "ongoing"])

    total_wins = len([m for m in matches if m.final_result == "win"])
    total_losses = len([m for m in matches if m.final_result == "loss"])

    print(total_matches)


    win_percentage = round((total_wins / completed_matches) * 100, 1) if completed_matches > 0 else 0.0
    print(win_percentage)

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

    stats_obj = StudentStats(
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
    print(stats_obj)


    return StudentWithStats(
        id=student.id,
        name=student.name,
        phone=student.phone,
        email=student.email,
        notes=student.notes,
        created_at=student.created_at,
        updated_at=student.updated_at,
        stats=stats_obj,
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):
    """Update a student"""
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student"""
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(db_student)
    db.commit()
    return None