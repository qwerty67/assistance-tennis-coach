import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenPair
from app.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    get_user_by_identifier,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if phone already registered
    existing_phone = db.query(User).filter(User.phone == user_data.phone.strip()).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این شماره موبایل قبلاً در پلتفرم ثبت شده است"
        )

    # Check email if provided
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email.strip().lower()).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این ایمیل قبلاً در پلتفرم ثبت شده است"
            )

    new_user = User(
        id=str(uuid.uuid4()),
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip(),
        phone=user_data.phone.strip(),
        email=user_data.email.strip().lower() if user_data.email else None,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role or "COACH",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {
        "sub": str(new_user.id),
        "user_id": str(new_user.id),
        "phone": new_user.phone,
        "role": new_user.role,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    user_resp = UserResponse(
        id=str(new_user.id),
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        full_name=new_user.full_name,
        phone=new_user.phone,
        email=new_user.email,
        role=new_user.role,
    )

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_resp,
    )


@router.post("/login", response_model=TokenPair)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    identifier = request.login_identifier
    user = authenticate_user(db, identifier, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="شماره موبایل / ایمیل یا رمز عبور اشتباه است",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {
        "sub": str(user.id),
        "user_id": str(user.id),
        "phone": user.phone,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    user_resp = UserResponse(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        role=user.role,
    )

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_resp,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        phone=current_user.phone,
        email=current_user.email,
        role=current_user.role,
    )
