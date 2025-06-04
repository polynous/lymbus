from .base import Base
from .user import User, Staff, Guardian, guardian_student
from .school import School, Classroom, Student, GradeLevel
from .access import AccessLog, QRCode, FacialRecognition, AccessType, AuthorizedBy
from .invitation import Invitation, InvitationType
from .notification import Notification

# Para creación de tablas
def create_tables(engine):
    Base.metadata.create_all(bind=engine)

# Re-export everything for easy importing
__all__ = [
    'User',
    'Staff', 
    'Guardian',
    'guardian_student',
    'School',
    'Student',
    'Grade',
    'AccessLog',
    'Invitation',
    'Notification'
] 