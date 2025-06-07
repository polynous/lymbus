from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, Staff
from app.services.auth import get_password_hash

def create_admin_user():
    """Create an admin user for testing purposes"""
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        
        if admin:
            print(f"Admin user already exists: {admin.email}")
            return
        
        # Create admin user
        print("Creating admin user...")
        admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash("password"),
            first_name="Admin",
            last_name="User",
            is_active=True,
            is_admin=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # Create staff profile
        staff = Staff(
            user_id=admin.id,
            position="Administrator",
            department="IT"
        )
        db.add(staff)
        db.commit()
        
        print(f"✅ Admin user created successfully: {admin.email}")
    
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user() 