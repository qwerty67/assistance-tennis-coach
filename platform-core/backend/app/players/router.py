import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.auth.router import get_current_user_payload

router = APIRouter(prefix="/api/v1/students", tags=["students"])


class StudentCreate(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    level: Optional[str] = "beginner"


class StudentResponse(BaseModel):
    id: str
    coach_id: Optional[str] = None
    first_name: str
    last_name: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    level: Optional[str] = None
    created_at: Optional[str] = None


def _resolve_coach_id(db: Session, payload: Dict[str, Any]) -> str:
    user_id = payload.get("sub") or payload.get("user_id")
    row = db.execute(
        text("SELECT id FROM coaches WHERE user_id = :uid"),
        {"uid": str(user_id)}
    ).fetchone()
    if row and row[0]:
        return str(row[0])

    # If no coach profile exists yet, create one
    coach_id = uuid.uuid4().hex
    now_iso = datetime.now(timezone.utc).isoformat()
    db.execute(
        text("INSERT INTO coaches (id, user_id, timezone, currency, settings, created_at, updated_at) VALUES (:cid, :uid, 'Asia/Tehran', 'IRT', '{}', :now, :now)"),
        {"cid": coach_id, "uid": str(user_id), "now": now_iso}
    )
    db.commit()
    return coach_id


@router.get("", response_model=List[StudentResponse])
@router.get("/", response_model=List[StudentResponse])
def get_students(
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coach_id = _resolve_coach_id(db, payload)

    rows = db.execute(
        text("""
            SELECT id, coach_id, first_name, last_name, phone, email, coach_notes, level, created_at
            FROM students
            WHERE coach_id = :cid AND (deleted_at IS NULL)
            ORDER BY created_at DESC
        """),
        {"cid": coach_id}
    ).fetchall()

    result = []
    for r in rows:
        sid, cid, fn, ln, ph, em, notes, lvl, cr = r
        fn = fn or ""
        ln = ln or ""
        result.append(StudentResponse(
            id=str(sid),
            coach_id=str(cid) if cid else None,
            first_name=fn,
            last_name=ln,
            name=f"{fn} {ln}".strip(),
            phone=ph,
            email=em,
            notes=notes,
            level=lvl,
            created_at=str(cr) if cr else None,
        ))
    return result


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreate,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    coach_id = _resolve_coach_id(db, payload)

    first_name = req.first_name
    last_name = req.last_name
    if not first_name and req.name:
        parts = req.name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    first_name = first_name or "شاگرد"
    last_name = last_name or ""

    sid = uuid.uuid4().hex
    now_iso = datetime.now(timezone.utc).isoformat()

    db.execute(
        text("""
            INSERT INTO students (id, coach_id, first_name, last_name, phone, email, coach_notes, level, status, version, created_at, updated_at)
            VALUES (:id, :cid, :fn, :ln, :ph, :em, :notes, :lvl, 'active', 1, :now, :now)
        """),
        {
            "id": sid,
            "cid": coach_id,
            "fn": first_name,
            "ln": last_name,
            "ph": req.phone,
            "em": req.email,
            "notes": req.notes,
            "lvl": req.level or "beginner",
            "now": now_iso,
        }
    )
    db.commit()

    return StudentResponse(
        id=sid,
        coach_id=coach_id,
        first_name=first_name,
        last_name=last_name,
        name=f"{first_name} {last_name}".strip(),
        phone=req.phone,
        email=req.email,
        notes=req.notes,
        level=req.level or "beginner",
        created_at=now_iso,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: str,
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    row = db.execute(
        text("""
            SELECT id, coach_id, first_name, last_name, phone, email, coach_notes, level, created_at
            FROM students
            WHERE id = :sid AND (deleted_at IS NULL)
        """),
        {"sid": student_id}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Student not found")

    sid, cid, fn, ln, ph, em, notes, lvl, cr = row
    fn = fn or ""
    ln = ln or ""

    return StudentResponse(
        id=str(sid),
        coach_id=str(cid) if cid else None,
        first_name=fn,
        last_name=ln,
        name=f"{fn} {ln}".strip(),
        phone=ph,
        email=em,
        notes=notes,
        level=lvl,
        created_at=str(cr) if cr else None,
    )
