import uuid
import enum
from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Index, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.infrastructure.db.base import Base, TimestampMixin, UUIDPkMixin

class MatchStatus(str, enum.Enum):
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class MatchResult(str, enum.Enum):
    win = "win"
    loss = "loss"
    draw = "draw"

class PilotMatch(UUIDPkMixin, TimestampMixin, Base):
    """Tennis match recorded for AI analysis, adapted to platform Student and Coach."""
    __tablename__ = "pilot_matches"
    __table_args__ = (
        Index("ix_pilot_matches_student", "student_id"),
        Index("ix_pilot_matches_coach", "coach_id"),
    )

    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)

    opponent_name: Mapped[str] = mapped_column(String(100))
    match_date: Mapped[str] = mapped_column(String(20)) # YYYY-MM-DD
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    match_type: Mapped[str] = mapped_column(String(50), default="singles")
    status: Mapped[MatchStatus] = mapped_column(Enum(MatchStatus, native_enum=False), default=MatchStatus.ongoing)
    sets_score: Mapped[str | None] = mapped_column(String(50), nullable=True)
    final_result: Mapped[MatchResult | None] = mapped_column(Enum(MatchResult, native_enum=False), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    student_games_won: Mapped[int] = mapped_column(Integer, default=0)
    opponent_games_won: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    student: Mapped["Student"] = relationship("Student") # noqa: F821
    coach: Mapped["Coach"] = relationship("Coach") # noqa: F821
    points: Mapped[list["PilotPoint"]] = relationship("PilotPoint", back_populates="match", cascade="all, delete-orphan")
    analyses: Mapped[list["PilotAnalysis"]] = relationship("PilotAnalysis", back_populates="match", cascade="all, delete-orphan")

class PilotPoint(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "pilot_points"
    __table_args__ = (
        Index("ix_pilot_points_match", "match_id"),
    )

    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pilot_matches.id", ondelete="CASCADE"), index=True)
    point_number: Mapped[int] = mapped_column(Integer, nullable=False)
    set_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    game_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    game_score: Mapped[str | None] = mapped_column(String(20), nullable=True)

    server: Mapped[str | None] = mapped_column(String(20), nullable=True) # student or opponent
    serve_type: Mapped[str | None] = mapped_column(String(20), nullable=True) # first or second
    serve_result: Mapped[str | None] = mapped_column(String(20), nullable=True) # ace, fault, double_fault, in

    return_result: Mapped[str | None] = mapped_column(String(20), nullable=True) # in, error, net

    final_stroke_player: Mapped[str | None] = mapped_column(String(20), nullable=True)
    final_stroke_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    final_stroke_direction: Mapped[str | None] = mapped_column(String(50), nullable=True)
    final_stroke_result: Mapped[str | None] = mapped_column(String(50), nullable=True) # winner, unforced_error, forced_error, net

    point_winner: Mapped[str] = mapped_column(String(20), nullable=False) # student or opponent

    match: Mapped["PilotMatch"] = relationship("PilotMatch", back_populates="points")

class PilotAnalysis(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "pilot_analyses"
    __table_args__ = (
        Index("ix_pilot_analyses_match", "match_id"),
    )

    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pilot_matches.id", ondelete="CASCADE"), index=True)
    markdown_report: Mapped[str] = mapped_column(Text, nullable=False)
    statistics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    match_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)

    match: Mapped["PilotMatch"] = relationship("PilotMatch", back_populates="analyses")
