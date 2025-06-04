from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import enum
from datetime import datetime, date, time, timezone, timedelta

class AccessType(enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"

class AuthorizedBy(enum.Enum):
    QR_CODE = "qr_code"
    FACIAL_RECOGNITION = "facial_recognition"
    MANUAL = "manual"

class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    access_type = Column(Enum(AccessType))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    guardian_id = Column(Integer, ForeignKey("guardians.id"), nullable=True)
    authorized_by = Column(Enum(AuthorizedBy))
    authorized_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    notes = Column(String, nullable=True)
    
    # Relaciones
    student = relationship("Student", back_populates="access_logs")
    guardian = relationship("Guardian")
    authorized_by_staff = relationship("Staff")

    @staticmethod
    def get_today_date():
        """Returns today's date at midnight (start of day) as a timezone-aware datetime"""
        today = datetime.now().date()
        # Create a timezone-aware datetime at midnight
        return datetime.combine(today, time.min).replace(tzinfo=timezone.utc)

class QRCode(Base):
    __tablename__ = "qr_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    guardian_id = Column(Integer, ForeignKey("guardians.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    code = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    guardian = relationship("Guardian", back_populates="qr_codes")
    student = relationship("Student")

class FacialRecognition(Base):
    __tablename__ = "facial_recognition"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    face_encoding = Column(Text)  # Almacenamos la codificación facial como texto
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    user = relationship("User") 