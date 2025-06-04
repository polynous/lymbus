from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: int
    read: bool
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationMarkAllRead(BaseModel):
    mark_read: bool = True 