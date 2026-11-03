from datetime import datetime, timedelta
from typing import Optional
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

# SSO SECRET & ALGORITHM aligned with Coach Assistant Platform
PLATFORM_JWT_SECRET = "CHANGE_ME_IN_PRODUCTION_please_use_a_long_random_string"
PILOT_SECRET_KEY = "tennis-pilot-secret-key-change-in-production-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, PLATFORM_JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
):
    token = credentials.credentials
    # 1. Try decoding with Coach Assistant Platform SSO secret
    for secret in (PLATFORM_JWT_SECRET, PILOT_SECRET_KEY):
        try:
            payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
            sub = payload.get("sub")
            if sub:
                # Check local user or create virtual proxy user
                user = get_user_by_username(db, sub)
                if not user:
                    user = User(
                        username=sub,
                        full_name=payload.get("name", "Coach Assistant User"),
                        hashed_password="SSO_DELEGATED_USER"
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                return user
        except JWTError:
            continue

    raise HTTPException(status_code=401, detail="Invalid or expired token across SSO Platform")
