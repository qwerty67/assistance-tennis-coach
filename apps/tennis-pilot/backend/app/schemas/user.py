from pydantic import BaseModel

class UserCreate(BaseModel):
    full_name: str
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str