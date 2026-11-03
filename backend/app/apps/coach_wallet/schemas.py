import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.application.schemas.common import ORMModel

class WalletOut(ORMModel):
    id: uuid.UUID
    coach_id: uuid.UUID
    balance: int
    pending_settlement: int
    iban: str | None = None
    bank_name: str | None = None
    account_holder: str | None = None

class WalletUpdateBank(BaseModel):
    iban: str = Field(min_length=10, max_length=34)
    bank_name: str | None = None
    account_holder: str | None = None

class SettlementCreate(BaseModel):
    amount: int = Field(gt=0)
    iban: str | None = None
    account_holder: str | None = None

class SettlementOut(ORMModel):
    id: uuid.UUID
    coach_id: uuid.UUID
    amount: int
    status: str
    iban: str
    account_holder: str | None = None
    tracking_code: str | None = None
    created_at: datetime
    processed_at: datetime | None = None

class WalletTransactionOut(ORMModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    amount: int
    tx_type: str
    reference_id: str | None = None
    description: str | None = None
    created_at: datetime
