import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.application.context import Actor
from app.core.exceptions import ValidationError
from app.apps.coach_wallet.models import CoachWallet, WalletTransaction, SettlementRequest
from app.apps.coach_wallet.schemas import SettlementCreate, WalletUpdateBank

class CoachWalletService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_wallet(self, coach_id: uuid.UUID) -> CoachWallet:
        wallet = self.db.scalar(select(CoachWallet).where(CoachWallet.coach_id == coach_id))
        if not wallet:
            wallet = CoachWallet(coach_id=coach_id, balance=0, pending_settlement=0)
            self.db.add(wallet)
            self.db.flush()
        return wallet

    def update_bank_info(self, actor: Actor, data: WalletUpdateBank) -> CoachWallet:
        wallet = self.get_or_create_wallet(actor.coach_id)
        wallet.iban = data.iban.strip()
        wallet.bank_name = data.bank_name
        wallet.account_holder = data.account_holder
        self.db.commit()
        return wallet

    def request_settlement(self, actor: Actor, data: SettlementCreate) -> SettlementRequest:
        wallet = self.get_or_create_wallet(actor.coach_id)
        available = wallet.balance - wallet.pending_settlement
        if data.amount > available:
            raise ValidationError(f"???? ???????? ????? ?? ?????? ???? ????? ??? ({available:,} ?????)")

        target_iban = data.iban or wallet.iban
        if not target_iban:
            raise ValidationError("????? ??? ??? ??? ??????? ????? ?????? ???")

        req = SettlementRequest(
            coach_id=actor.coach_id,
            amount=data.amount,
            status="pending",
            iban=target_iban,
            account_holder=data.account_holder or wallet.account_holder,
        )
        wallet.pending_settlement += data.amount
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        return req

    def list_transactions(self, actor: Actor, limit: int = 50) -> list[WalletTransaction]:
        wallet = self.get_or_create_wallet(actor.coach_id)
        stmt = (
            select(WalletTransaction)
            .where(WalletTransaction.wallet_id == wallet.id)
            .order_by(WalletTransaction.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def list_settlements(self, actor: Actor) -> list[SettlementRequest]:
        stmt = (
            select(SettlementRequest)
            .where(SettlementRequest.coach_id == actor.coach_id)
            .order_by(SettlementRequest.created_at.desc())
        )
        return list(self.db.scalars(stmt))
