import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt
import jwt

from app.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

JWT_SECRET = "tennis-platform-shared-secret-key-2026-production"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
ISSUER = "tennis-platform-core"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_token(payload: Dict[str, Any], expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    exp = now + expires_delta
    to_encode = {**payload, "iat": int(now.timestamp()), "exp": int(exp.timestamp()), "iss": ISSUER}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Phone number or email")
    password: str


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str = "coach"


class UserProfile(BaseModel):
    id: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    role: str
    coach_id: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile


def _find_coach_id_for_user(db: Session, user_id: str) -> Optional[str]:
    row = db.execute(
        text("SELECT id FROM coaches WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()
    return str(row[0]) if row and row[0] else None


def get_current_user_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication credentials required")
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=ISSUER,
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip().lower()

    row = db.execute(
        text("SELECT id, first_name, last_name, email, phone, password_hash, role, is_active FROM users WHERE LOWER(phone) = :p OR LOWER(email) = :e"),
        {"p": req.identifier.strip(), "e": ident}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid identifier or password")

    user_id, first_name, last_name, email, phone, password_hash, role, is_active = row
    user_id = str(user_id)

    if not verify_password(req.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid identifier or password")

    coach_id = _find_coach_id_for_user(db, user_id) if role == "coach" else None

    # Generate Tokens
    access_token = create_token(
        {
            "sub": user_id,
            "user_id": user_id,
            "role": role,
            "coach_id": coach_id,
            "phone": phone,
            "email": email,
        },
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token = create_token(
        {
            "sub": user_id,
            "type": "refresh",
        },
        timedelta(days=30),
    )

    # Update last login
    now_iso = datetime.now(timezone.utc).isoformat()
    db.execute(text("UPDATE users SET last_login_at = :now WHERE id = :uid"), {"now": now_iso, "uid": user_id})
    db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile(
            id=user_id,
            first_name=first_name or "",
            last_name=last_name or "",
            full_name=f"{first_name or ''} {last_name or ''}".strip(),
            phone=phone,
            email=email,
            role=role,
            coach_id=coach_id,
        )
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check uniqueness
    existing = db.execute(
        text("SELECT id FROM users WHERE phone = :p OR (email IS NOT NULL AND email = :e)"),
        {"p": req.phone.strip(), "e": req.email.strip() if req.email else None}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Phone or email already registered")

    user_id = uuid.uuid4().hex
    now_iso = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.password)
    user_role = req.role.lower()

    db.execute(
        text("""
            INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, is_active, locale, created_at, updated_at)
            VALUES (:id, :fn, :ln, :em, :ph, :pw, :role, 1, 'fa', :now, :now)
        """),
        {
            "id": user_id,
            "fn": req.first_name.strip(),
            "ln": req.last_name.strip(),
            "em": req.email.strip() if req.email else None,
            "ph": req.phone.strip(),
            "pw": hashed,
            "role": user_role,
            "now": now_iso,
        }
    )

    coach_id = None
    if user_role == "coach":
        coach_id = uuid.uuid4().hex
        db.execute(
            text("""
                INSERT INTO coaches (id, user_id, timezone, currency, settings, created_at, updated_at)
                VALUES (:cid, :uid, 'Asia/Tehran', 'IRT', '{}', :now, :now)
            """),
            {"cid": coach_id, "uid": user_id, "now": now_iso}
        )

    db.commit()

    access_token = create_token(
        {"sub": user_id, "user_id": user_id, "role": user_role, "coach_id": coach_id},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_token({"sub": user_id, "type": "refresh"}, timedelta(days=30))

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile(
            id=user_id,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            full_name=f"{req.first_name.strip()} {req.last_name.strip()}",
            phone=req.phone.strip(),
            email=req.email.strip() if req.email else None,
            role=user_role,
            coach_id=coach_id,
        )
    )


@router.get("/me", response_model=UserProfile)
def get_me(payload: Dict[str, Any] = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = payload.get("sub") or payload.get("user_id")
    row = db.execute(
        text("SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = :uid"),
        {"uid": str(user_id)}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    uid, fn, ln, em, ph, role = row
    coach_id = _find_coach_id_for_user(db, str(uid))

    return UserProfile(
        id=str(uid),
        first_name=fn or "",
        last_name=ln or "",
        full_name=f"{fn or ''} {ln or ''}".strip(),
        phone=ph,
        email=em,
        role=role,
        coach_id=coach_id,
    )
