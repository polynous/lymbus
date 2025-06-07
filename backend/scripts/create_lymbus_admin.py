from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, Staff
from app.services.auth import get_password_hash

def create_lymbus_admin():
    """Create admin@lymbus.com user for frontend compatibility"""
    db = SessionLocal()
    try:
        # Check if admin@lymbus.com exists
        admin = db.query(User).filter(User.email == "admin@lymbus.com").first()
        
        if admin:
            print("Admin user admin@lymbus.com already exists")
            return
        
        # Create admin user
        print("Creating admin@lymbus.com user...")
        admin = User(
            email="admin@lymbus.com",
            hashed_password=get_password_hash("password"),
            first_name="Admin",
            last_name="Lymbus",
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
        
        print("✅ Admin user admin@lymbus.com created successfully")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_lymbus_admin() 