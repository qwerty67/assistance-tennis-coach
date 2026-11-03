from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func

class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)

    point_number = Column(Integer, nullable=False)
    set_number = Column(Integer, nullable=True)
    game_number = Column(Integer, nullable=True)
    game_score = Column(String(20), nullable=True)

    server = Column(String(20), nullable=True) # 'student' or 'opponent'
    serve_type = Column(String(20), nullable=True) # 'first' or 'second'
    serve_result = Column(String(20), nullable=True) # 'ace', 'fault', 'double_fault', 'in'

    return_result = Column(String(20), nullable=True) # 'in', 'error', 'net'

    final_stroke_player = Column(String(20), nullable=True)
    final_stroke_type = Column(String(50), nullable=True)
    final_stroke_direction = Column(String(50), nullable=True)
    final_stroke_result = Column(String(50), nullable=True) # 'winner', 'unforced_error', 'forced_error', 'net'

    point_winner = Column(String(20), nullable=False) # 'student' or 'opponent'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    match = relationship("Match", back_populates="points")