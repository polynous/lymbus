from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timedelta
import secrets

from .base import Base

class InvitationType(enum.Enum):
    STAFF = "staff"  # Para personal de la escuela
    GUARDIAN = "guardian"  # Para padres/tutores

class Invitation(Base):
    __tablename__ = "invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    invitation_type = Column(Enum(InvitationType))
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    school_id = Column(Integer, ForeignKey("schools.id"))
    
    # Para invitaciones de tipo GUARDIAN, estos campos serían necesarios
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    relationship_type = Column(String, nullable=True)  # padre, madre, tío, etc.
    
    # Para invitaciones de tipo STAFF, estos campos serían necesarios
    position = Column(String, nullable=True)
    department = Column(String, nullable=True)
    
    # Relaciones
    created_by = relationship("User", foreign_keys=[created_by_id])
    school = relationship("School")
    student = relationship("Student", foreign_keys=[student_id])
    
    @staticmethod
    def generate_token():
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_expiration_date(days=7):
        return datetime.utcnow() + timedelta(days=days) 