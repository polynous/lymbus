#!/usr/bin/env python3
"""
Test script to verify the notification system is working properly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate

def test_notification_system():
    """Test the notification system by creating sample notifications."""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get the first user
        user = db.query(User).first()
        
        if not user:
            print('❌ No users found in database')
            return False
        
        print(f'🔔 Creating test notification for user: {user.email}')
        
        # Initialize notification service
        notification_service = NotificationService(db)
        
        # Create test notifications
        test_notifications = [
            {
                'title': 'Sistema de notificaciones activado',
                'message': 'El sistema de notificaciones en tiempo real está funcionando correctamente',
                'type': 'success'
            },
            {
                'title': 'Entrada registrada',
                'message': 'María García ha llegado a la escuela a las 08:15',
                'type': 'info'
            },
            {
                'title': 'Recordatorio importante',
                'message': 'No olvides recoger a tu hijo antes de las 16:00',
                'type': 'warning'
            }
        ]
        
        created_count = 0
        for notif_data in test_notifications:
            notification_create = NotificationCreate(
                user_id=user.id,
                **notif_data
            )
            
            notification = notification_service.create_notification(notification_create)
            print(f'✅ Created notification: {notification.title} (ID: {notification.id})')
            created_count += 1
        
        # Check unread count
        unread_count = notification_service.get_unread_count(user.id)
        print(f'📊 Total unread notifications for user: {unread_count}')
        
        print(f'\n🎉 Successfully created {created_count} test notifications!')
        print('💡 You can now test the real-time notification system in the frontend.')
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == '__main__':
    success = test_notification_system()
    sys.exit(0 if success else 1) 