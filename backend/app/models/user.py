from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    staff_profile = relationship("Staff", back_populates="user", uselist=False)
    guardian_profile = relationship("Guardian", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    position = Column(String)
    department = Column(String)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="staff_profile")
    school_id = Column(Integer, ForeignKey("schools.id"))
    school = relationship("School", back_populates="staff")

class Guardian(Base):
    __tablename__ = "guardians"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    relationship_type = Column(String)  # padre, madre, tío, etc.
    phone = Column(String)
    secondary_phone = Column(String, nullable=True)
    address = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="guardian_profile")
    students = relationship("Student", secondary="guardian_student", back_populates="guardians")
    qr_codes = relationship("QRCode", back_populates="guardian")

# Tabla de relación entre tutores y estudiantes
guardian_student = Table(
    "guardian_student",
    Base.metadata,
    Column("guardian_id", Integer, ForeignKey("guardians.id"), primary_key=True),
    Column("student_id", Integer, ForeignKey("students.id"), primary_key=True),
) 