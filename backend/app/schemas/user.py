from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Esquemas base
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False
    user_type: Optional[str] = None
    school_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

# Esquemas para Staff
class StaffBase(BaseModel):
    position: str
    department: str
    phone: str
    school_id: int

class StaffCreate(StaffBase):
    user_id: Optional[int] = None

class Staff(StaffBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para Guardian
class GuardianBase(BaseModel):
    relationship_type: str
    phone: str
    secondary_phone: Optional[str] = None
    address: Optional[str] = None

class GuardianCreate(GuardianBase):
    user_id: Optional[int] = None

class Guardian(GuardianBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserInDBBase(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema for responses (what client receives)
class User(UserInDBBase):
    pass

# Esquemas para autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
    id: Optional[int] = None 