from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    clean_id = identifier.strip().lower()
    return db.query(User).filter(
        or_(
            User.phone == identifier.strip(),
            User.email.ilike(clean_id)
        )
    ).first()


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    user = get_user_by_identifier(db, identifier)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"iat": now, "exp": expire, "iss": "tennis-platform-core"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=30))
    to_encode.update({"iat": now, "exp": expire, "type": "refresh", "iss": "tennis-platform-core"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], issuer="tennis-platform-core")
        user_id: str = payload.get("sub") or payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Lookup by user_id or phone
        user = db.query(User).filter(or_(User.id == str(user_id), User.phone == str(user_id))).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
