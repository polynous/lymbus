from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import enum

class GradeLevel(enum.Enum):
    PREMATERNAL = "Prematernal"
    MATERNAL = "Maternal"
    KINDER_1 = "Kínder 1"
    KINDER_2 = "Kínder 2"
    KINDER_3 = "Kínder 3"
    PRIMARIA_1 = "Primaria 1"
    PRIMARIA_2 = "Primaria 2"
    PRIMARIA_3 = "Primaria 3"
    PRIMARIA_4 = "Primaria 4"
    PRIMARIA_5 = "Primaria 5"
    PRIMARIA_6 = "Primaria 6"
    SECUNDARIA_1 = "Secundaria 1"
    SECUNDARIA_2 = "Secundaria 2"
    SECUNDARIA_3 = "Secundaria 3"
    PREPARATORIA_1_2 = "Preparatoria 1 y 2"
    PREPARATORIA_3_4 = "Preparatoria 3 y 4"
    PREPARATORIA_5_6 = "Preparatoria 5 y 6"

class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String, default="México")
    phone = Column(String)
    email = Column(String)
    website = Column(String, nullable=True)
    director_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    students = relationship("Student", back_populates="school")
    staff = relationship("Staff", back_populates="school")
    classrooms = relationship("Classroom", back_populates="school")

class Classroom(Base):
    __tablename__ = "classrooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    grade_level = Column(Enum(GradeLevel))
    school_id = Column(Integer, ForeignKey("schools.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    school = relationship("School", back_populates="classrooms")
    students = relationship("Student", back_populates="classroom")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    enrollment_id = Column(String, unique=True, index=True)
    date_of_birth = Column(Date)
    gender = Column(String)
    medical_notes = Column(String, nullable=True)
    school_id = Column(Integer, ForeignKey("schools.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    school = relationship("School", back_populates="students")
    classroom = relationship("Classroom", back_populates="students")
    guardians = relationship("Guardian", secondary="guardian_student", back_populates="students")
    access_logs = relationship("AccessLog", back_populates="student")
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}" 