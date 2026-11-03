from fastapi import APIRouter
from app.api.deps import CoachActor, DB
from app.apps.coach_wallet.schemas import (
    WalletOut, WalletUpdateBank, SettlementCreate, SettlementOut, WalletTransactionOut
)
from app.apps.coach_wallet.service import CoachWalletService

router = APIRouter(prefix="/wallet", tags=["wallet"])

@router.get("", response_model=WalletOut)
def get_wallet(actor: CoachActor, db: DB):
    service = CoachWalletService(db)
    return service.get_or_create_wallet(actor.coach_id)

@router.put("/bank-info", response_model=WalletOut)
def update_bank(data: WalletUpdateBank, actor: CoachActor, db: DB):
    service = CoachWalletService(db)
    return service.update_bank_info(actor, data)

@router.post("/settle", response_model=SettlementOut, status_code=201)
def request_settlement(data: SettlementCreate, actor: CoachActor, db: DB):
    service = CoachWalletService(db)
    return service.request_settlement(actor, data)

@router.get("/settlements", response_model=list[SettlementOut])
def list_settlements(actor: CoachActor, db: DB):
    service = CoachWalletService(db)
    return service.list_settlements(actor)

@router.get("/transactions", response_model=list[WalletTransactionOut])
def list_transactions(actor: CoachActor, db: DB):
    service = CoachWalletService(db)
    return service.list_transactions(actor)
