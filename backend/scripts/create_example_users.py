import os
import sys
import sqlite3
from datetime import datetime, timedelta
import secrets
import hashlib
import base64

# Path to database
DB_PATH = "backend/lymbus.db"

# Function to generate password hash (simplified version of what's in auth.py)
def get_password_hash(password):
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    storage = salt + key
    return base64.b64encode(storage).decode('utf-8')

def create_admin_user(conn):
    """Create an admin user and corresponding staff record"""
    cursor = conn.cursor()
    
    # Check if admin user already exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@lymbus.com'")
    if cursor.fetchone()[0] > 0:
        print("Admin user already exists")
        cursor.execute("SELECT id FROM users WHERE email = 'admin@lymbus.com'")
        admin_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM schools LIMIT 1")
        school_id = cursor.fetchone()[0]
        return admin_id, school_id
    
    # Create admin user
    hashed_pw = get_password_hash("admin123")
    cursor.execute("""
    INSERT INTO users (email, hashed_password, first_name, last_name, is_active, is_admin)
    VALUES (?, ?, ?, ?, ?, ?)
    """, ('admin@lymbus.com', hashed_pw, 'Admin', 'Lymbus', True, True))
    
    admin_id = cursor.lastrowid
    
    # Create a school if none exists
    cursor.execute("SELECT COUNT(*) FROM schools")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO schools (name, address, city, state, postal_code, country, phone, email, website, director_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ('Colegio Ejemplo', 'Calle Principal 123', 'Ciudad de México', 'CDMX', '01000', 
              'México', '555-123-4567', 'info@colegioejemplo.com', 'www.colegioejemplo.com', 'Admin Lymbus'))
    
    # Get school id
    cursor.execute("SELECT id FROM schools LIMIT 1")
    school_id = cursor.fetchone()[0]
    
    # Create staff record
    cursor.execute("""
    INSERT INTO staff (user_id, position, department, phone, school_id)
    VALUES (?, ?, ?, ?, ?)
    """, (admin_id, 'Director', 'Dirección', '555-987-6543', school_id))
    
    print(f"Created admin user (id: {admin_id}) with credentials: admin@lymbus.com / admin123")
    return admin_id, school_id

def create_parent_user(conn, admin_id, school_id):
    """Create a parent user, invitation, student, and link them together"""
    cursor = conn.cursor()
    
    # Check if parent user already exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE email = 'padre@ejemplo.com'")
    if cursor.fetchone()[0] > 0:
        print("Parent user already exists")
        return
        
    # Create a classroom if none exists
    cursor.execute("SELECT COUNT(*) FROM classrooms")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO classrooms (name, grade_level, school_id)
        VALUES (?, ?, ?)
        """, ('Aula 101', 'Primaria 3', school_id))
            
    # Get classroom id
    cursor.execute("SELECT id FROM classrooms LIMIT 1")
    classroom_id = cursor.fetchone()[0]
    
    # Create student if none exists
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO students (first_name, last_name, enrollment_id, date_of_birth, gender, 
                             school_id, classroom_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('Juan', 'Pérez', 'A12345', '2015-05-10', 'M', school_id, classroom_id))
    
    # Get student id
    cursor.execute("SELECT id FROM students LIMIT 1")
    student_id = cursor.fetchone()[0]
    
    # Create invitation for parent
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    cursor.execute("""
    INSERT INTO invitations (email, token, invitation_type, is_used, expires_at, created_by_id, 
                           school_id, student_id, relationship_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ('padre@ejemplo.com', token, 'guardian', True, expires_at.isoformat(), admin_id, 
          school_id, student_id, 'padre'))
    
    # Create parent user
    hashed_pw = get_password_hash("padre123")
    cursor.execute("""
    INSERT INTO users (email, hashed_password, first_name, last_name, is_active, is_admin)
    VALUES (?, ?, ?, ?, ?, ?)
    """, ('padre@ejemplo.com', hashed_pw, 'Carlos', 'Pérez', True, False))
    
    parent_id = cursor.lastrowid
    
    # Create guardian record
    cursor.execute("""
    INSERT INTO guardians (user_id, relationship_type, phone, address)
    VALUES (?, ?, ?, ?)
    """, (parent_id, 'padre', '555-123-4567', 'Av. Principal 456'))
    
    guardian_id = cursor.lastrowid
    
    # Link guardian to student
    cursor.execute("""
    INSERT INTO guardian_student (guardian_id, student_id)
    VALUES (?, ?)
    """, (guardian_id, student_id))
    
    print(f"Created parent user (id: {parent_id}) with credentials: padre@ejemplo.com / padre123")

def main():
    # Connect to database
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        print(f"Connected to database at {DB_PATH}")
        
        # Create admin user
        admin_id, school_id = create_admin_user(conn)
        
        # Create parent user
        create_parent_user(conn, admin_id, school_id)
        
        # Commit changes
        conn.commit()
        print("Example users created successfully!")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main() 