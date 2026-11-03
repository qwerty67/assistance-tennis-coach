import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.application.schemas.common import ORMModel

class InitiateOnlinePaymentRequest(BaseModel):
    amount: int = Field(gt=0)
    coach_id: uuid.UUID
    term_id: uuid.UUID | None = None
    class_id: uuid.UUID | None = None
    callback_url: str = Field(default="app://payment-callback")
    description: str | None = None

class OnlinePaymentInitResponse(BaseModel):
    transaction_id: uuid.UUID
    authority: str
    payment_url: str

class VerifyOnlinePaymentRequest(BaseModel):
    authority: str

class OnlinePaymentVerifyResponse(BaseModel):
    is_success: bool
    status: str
    amount: int
    ref_id: str | None = None
    message: str
