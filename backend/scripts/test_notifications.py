#!/usr/bin/env python3
"""
Test script to create sample notifications for testing the notification system.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate

def create_sample_notifications():
    """Create sample notifications for testing."""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get the first user (assuming there's at least one user)
        user = db.query(User).first()
        
        if not user:
            print("No users found in database. Please create a user first.")
            return
        
        print(f"Creating sample notifications for user: {user.email}")
        
        # Initialize notification service
        notification_service = NotificationService(db)
        
        # Sample notifications
        sample_notifications = [
            {
                "title": "Entrada registrada",
                "message": "María García ha llegado a la escuela a las 08:15",
                "type": "success"
            },
            {
                "title": "Salida registrada", 
                "message": "Juan Pérez ha salido de la escuela a las 15:30",
                "type": "info"
            },
            {
                "title": "Código QR generado",
                "message": "Se ha generado un nuevo código QR para recoger a Ana López",
                "type": "info"
            },
            {
                "title": "Recordatorio",
                "message": "No olvides recoger a tu hijo antes de las 16:00",
                "type": "warning"
            },
            {
                "title": "Sistema actualizado",
                "message": "El sistema Lymbus ha sido actualizado con nuevas funcionalidades",
                "type": "info"
            }
        ]
        
        # Create notifications
        for notif_data in sample_notifications:
            notification_create = NotificationCreate(
                user_id=user.id,
                **notif_data
            )
            
            notification = notification_service.create_notification(notification_create)
            print(f"Created notification: {notification.title}")
        
        print(f"\nSuccessfully created {len(sample_notifications)} sample notifications!")
        
        # Show current notification count
        total_notifications = notification_service.get_user_notifications(user.id, limit=100)
        unread_count = notification_service.get_unread_count(user.id)
        
        print(f"Total notifications for user: {len(total_notifications)}")
        print(f"Unread notifications: {unread_count}")
        
    except Exception as e:
        print(f"Error creating sample notifications: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_notifications() 