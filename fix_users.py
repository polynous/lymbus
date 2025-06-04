import sqlite3
from passlib.context import CryptContext

# Configure password hashing to match the auth service
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def fix_users():
    # Connect to the database
    conn = sqlite3.connect("backend/lymbus.db")
    cursor = conn.cursor()
    
    # Update admin user password
    admin_hash = get_password_hash("admin123")
    cursor.execute(
        "UPDATE users SET hashed_password = ? WHERE email = ?",
        (admin_hash, "admin@lymbus.com")
    )
    print(f"Updated admin user password")
    
    # Update parent user password
    parent_hash = get_password_hash("padre123")
    cursor.execute(
        "UPDATE users SET hashed_password = ? WHERE email = ?",
        (parent_hash, "padre@ejemplo.com")
    )
    print(f"Updated parent user password")
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("User passwords have been fixed with bcrypt hashing")

if __name__ == "__main__":
    fix_users() 