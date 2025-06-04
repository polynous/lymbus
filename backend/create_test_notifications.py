#!/usr/bin/env python3
"""
Simple script to create test notifications directly in the database.
"""

import sqlite3
import os
from datetime import datetime

# Path to the database
DB_PATH = os.path.join(os.path.dirname(__file__), 'lymbus.db')

def create_test_notifications():
    """Create test notifications directly in the database."""
    
    try:
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if we have any users
        cursor.execute("SELECT id, email FROM users LIMIT 1")
        user = cursor.fetchone()
        
        if not user:
            print("No users found in database. Please create a user first.")
            return
        
        user_id, email = user
        print(f"Creating test notifications for user: {email} (ID: {user_id})")
        
        # Sample notifications
        notifications = [
            {
                'title': 'Entrada registrada',
                'message': 'María García ha llegado a la escuela a las 08:15',
                'type': 'success',
                'user_id': user_id
            },
            {
                'title': 'Salida registrada',
                'message': 'Juan Pérez ha salido de la escuela a las 15:30',
                'type': 'info',
                'user_id': user_id
            },
            {
                'title': 'Código QR generado',
                'message': 'Se ha generado un nuevo código QR para recoger a Ana López',
                'type': 'info',
                'user_id': user_id
            },
            {
                'title': 'Recordatorio',
                'message': 'No olvides recoger a tu hijo antes de las 16:00',
                'type': 'warning',
                'user_id': user_id
            },
            {
                'title': 'Sistema actualizado',
                'message': 'El sistema Lymbus ha sido actualizado con nuevas funcionalidades',
                'type': 'info',
                'user_id': user_id
            },
            {
                'title': 'Alerta de asistencia',
                'message': 'Algunos estudiantes no han registrado entrada hoy',
                'type': 'warning',
                'user_id': user_id
            }
        ]
        
        # Insert notifications
        for notif in notifications:
            cursor.execute("""
                INSERT INTO notifications (title, message, type, user_id, read, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                notif['title'],
                notif['message'],
                notif['type'],
                notif['user_id'],
                False,  # read = False (unread)
                datetime.now().isoformat()
            ))
        
        # Create one read notification
        cursor.execute("""
            INSERT INTO notifications (title, message, type, user_id, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            'Bienvenido a Lymbus',
            'Tu cuenta ha sido configurada correctamente. ¡Bienvenido al sistema!',
            'success',
            user_id,
            True,  # read = True
            datetime.now().isoformat()
        ))
        
        # Commit changes
        conn.commit()
        
        # Check what we created
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as unread
            FROM notifications 
            WHERE user_id = ?
        """, (user_id,))
        
        total, unread = cursor.fetchone()
        
        print(f"\nSuccessfully created test notifications!")
        print(f"Total notifications: {total}")
        print(f"Unread notifications: {unread}")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_test_notifications() 