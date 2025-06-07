from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AccessTypeEnum(str, Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"

class AuthorizedByEnum(str, Enum):
    QR_CODE = "qr_code"
    FACIAL_RECOGNITION = "facial_recognition"
    MANUAL = "manual"

# Esquemas para AccessLog
class AccessLogBase(BaseModel):
    student_id: int
    access_type: AccessTypeEnum
    guardian_id: Optional[int] = None
    authorized_by: AuthorizedByEnum
    authorized_by_staff_id: Optional[int] = None
    notes: Optional[str] = None

class AccessLogCreate(AccessLogBase):
    pass

class AccessLog(AccessLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Esquemas para QRCode
class QRCodeBase(BaseModel):
    guardian_id: int
    is_active: bool = True
    expiration_date: Optional[datetime] = None

class QRCodeCreate(QRCodeBase):
    pass

class QRCode(QRCodeBase):
    id: int
    code: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para FacialRecognition
class FacialRecognitionBase(BaseModel):
    user_id: int
    face_encoding: str

class FacialRecognitionCreate(FacialRecognitionBase):
    pass

class FacialRecognition(FacialRecognitionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquema para verificación de salida
class StudentCheckoutRequest(BaseModel):
    student_id: int
    qr_code: Optional[str] = None
    face_image: Optional[str] = None  # Base64 encoded image
    guardian_id: Optional[int] = None
    staff_id: Optional[int] = None
    
class StudentCheckoutResponse(BaseModel):
    success: bool
    message: str
    access_log_id: Optional[int] = None

# Esquemas para búsqueda de alumnos
class GuardianInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    relationship_type: Optional[str] = None

class GradeLevelInfo(BaseModel):
    name: str

class StudentSearch(BaseModel):
    id: int
    first_name: str
    last_name: str
    enrollment_id: str
    grade_level: Optional[GradeLevelInfo] = None
    guardians: List[GuardianInfo] = [] 