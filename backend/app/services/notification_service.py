from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from ..models.notification import Notification
from ..models.user import User
from ..schemas.notification import NotificationCreate, NotificationUpdate
from datetime import datetime, timedelta

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """Create a new notification for a user"""
        notification = Notification(**notification_data.model_dump())
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def get_user_notifications(self, user_id: int, limit: int = 50, offset: int = 0) -> List[Notification]:
        """Get notifications for a specific user, ordered by newest first"""
        return (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def get_unread_notifications(self, user_id: int) -> List[Notification]:
        """Get all unread notifications for a user"""
        return (
            self.db.query(Notification)
            .filter(and_(Notification.user_id == user_id, Notification.read == False))
            .order_by(desc(Notification.created_at))
            .all()
        )
    
    def get_notification_by_id(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Get a specific notification by ID for a user"""
        return (
            self.db.query(Notification)
            .filter(and_(Notification.id == notification_id, Notification.user_id == user_id))
            .first()
        )
    
    def mark_notification_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a specific notification as read"""
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            notification.read = True
            self.db.commit()
            self.db.refresh(notification)
        return notification
    
    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        updated_count = (
            self.db.query(Notification)
            .filter(and_(Notification.user_id == user_id, Notification.read == False))
            .update({"read": True})
        )
        self.db.commit()
        return updated_count
    
    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a specific notification"""
        notification = self.get_notification_by_id(notification_id, user_id)
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False
    
    def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        return (
            self.db.query(Notification)
            .filter(and_(Notification.user_id == user_id, Notification.read == False))
            .count()
        )
    
    def create_system_notification(self, user_id: int, title: str, message: str, notification_type: str = "info"):
        """Helper method to create system notifications"""
        notification_data = NotificationCreate(
            title=title,
            message=message,
            type=notification_type,
            user_id=user_id
        )
        return self.create_notification(notification_data)
    
    def cleanup_old_notifications(self, days_old: int = 30):
        """Clean up notifications older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        deleted_count = (
            self.db.query(Notification)
            .filter(Notification.created_at < cutoff_date)
            .delete()
        )
        self.db.commit()
        return deleted_count 