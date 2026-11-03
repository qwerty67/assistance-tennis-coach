import uuid
from datetime import datetime
from sqlalchemy import BigInteger, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin

class CoachWallet(UUIDPkMixin, TimestampMixin, Base):
    """Coach internal wallet for holding incoming payments and processing withdrawals."""
    __tablename__ = "coach_wallets"

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), unique=True, index=True)
    balance: Mapped[int] = mapped_column(BigInteger, default=0)
    pending_settlement: Mapped[int] = mapped_column(BigInteger, default=0)
    iban: Mapped[str | None] = mapped_column(String(34), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    account_holder: Mapped[str | None] = mapped_column(String(150), nullable=True)

    transactions: Mapped[list["WalletTransaction"]] = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")

class WalletTransaction(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "wallet_transactions"
    __table_args__ = (
        Index("ix_wallet_tx_wallet_date", "wallet_id", "created_at"),
    )

    wallet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coach_wallets.id", ondelete="CASCADE"), index=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    tx_type: Mapped[str] = mapped_column(String(32))  # deposit, settlement, subscription_deduction, refund
    reference_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    wallet: Mapped["CoachWallet"] = relationship("CoachWallet", back_populates="transactions")

class SettlementRequest(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "settlement_requests"
    __table_args__ = (
        Index("ix_settlement_coach_status", "coach_id", "status"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    amount: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, processing, completed, rejected
    iban: Mapped[str] = mapped_column(String(34))
    account_holder: Mapped[str | None] = mapped_column(String(150), nullable=True)
    tracking_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(nullable=True)
