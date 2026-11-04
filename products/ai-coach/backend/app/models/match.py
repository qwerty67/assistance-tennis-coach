from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class MatchStatus(str, enum.Enum):
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class MatchResult(str, enum.Enum):
    win = "win"
    loss = "loss"
    draw = "draw"

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    opponent_name = Column(String(100), nullable=False)
    match_date = Column(String(20), nullable=False)
    location = Column(String(100), nullable=True)
    match_type = Column(String(50), default="singles")
    status = Column(Enum(MatchStatus), default=MatchStatus.ongoing)
    sets_score = Column(String(50), nullable=True)
    final_result = Column(Enum(MatchResult), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    student_games_won = Column(Integer, default=0)
    opponent_games_won = Column(Integer, default=0)

    # Relationships
    student = relationship("Student", back_populates="matches")
    points = relationship("Point", back_populates="match", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="match", cascade="all, delete-orphan")
