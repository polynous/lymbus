#!/usr/bin/env python3
import sqlite3
import os
import sys
from passlib.context import CryptContext

# Database path
DB_PATH = "backend/lymbus.db"

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_passwords():
    """Fix password hashes for existing users"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Update admin user password
        admin_hash = pwd_context.hash("admin123")
        cursor.execute("""
            UPDATE users 
            SET hashed_password = ? 
            WHERE email = 'admin@lymbus.com'
        """, (admin_hash,))
        
        # Update parent user password
        parent_hash = pwd_context.hash("padre123")
        cursor.execute("""
            UPDATE users 
            SET hashed_password = ? 
            WHERE email = 'padre@ejemplo.com'
        """, (parent_hash,))
        
        conn.commit()
        print("✅ Password hashes updated successfully!")
        print("Admin: admin@lymbus.com / admin123")
        print("Parent: padre@ejemplo.com / padre123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    fix_passwords() 