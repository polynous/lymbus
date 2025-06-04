from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class InvitationTypeEnum(str, Enum):
    STAFF = "staff"
    GUARDIAN = "guardian"

# Esquemas para invitaciones
class InvitationBase(BaseModel):
    email: EmailStr
    invitation_type: InvitationTypeEnum
    school_id: int
    
    # Campos para guardianes
    student_id: Optional[int] = None
    relationship_type: Optional[str] = None
    
    # Campos para personal
    position: Optional[str] = None
    department: Optional[str] = None

class InvitationCreate(InvitationBase):
    pass

class Invitation(InvitationBase):
    id: int
    token: str
    is_used: bool
    expires_at: datetime
    created_at: datetime
    created_by_id: int
    
    class Config:
        from_attributes = True

# Esquema para validación de invitación
class InvitationVerify(BaseModel):
    token: str

# Esquema para completar registro
class CompleteRegistration(BaseModel):
    token: str
    first_name: str
    last_name: str
    password: str
    
    # Campos adicionales (opcionales)
    phone: Optional[str] = None

# Esquema para respuesta de invitación
class InvitationResponse(BaseModel):
    id: int
    email: EmailStr
    invitation_type: str
    is_used: bool
    expires_at: datetime
    created_at: datetime
    invitation_url: str 