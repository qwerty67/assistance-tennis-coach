import uuid
from sqlalchemy import BigInteger, ForeignKey, Index, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin

class AIInteractionLog(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "ai_interaction_logs"
    __table_args__ = (
        Index("ix_ai_log_user", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    prompt_type: Mapped[str] = mapped_column(String(64))  # training_plan, performance_analysis, drill_recommendation
    input_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tokens_used: Mapped[int | None] = mapped_column(BigInteger, default=0, nullable=True)
