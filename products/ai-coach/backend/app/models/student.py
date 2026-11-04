import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(80), nullable=False, default="")
    last_name = Column(String(80), nullable=False, default="")
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    coach_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @name.setter
    def name(self, value: str):
        parts = (value or "").strip().split(" ", 1)
        self.first_name = parts[0]
        self.last_name = parts[1] if len(parts) > 1 else ""

    @property
    def notes(self) -> str:
        return self.coach_notes or ""

    @notes.setter
    def notes(self, value: str):
        self.coach_notes = value

    # Relationships
    matches = relationship("Match", back_populates="student", cascade="all, delete-orphan")
