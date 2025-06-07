from app.database import SessionLocal
from app.models.user import User
from app.services.auth import get_password_hash, verify_password

def fix_admin_password():
    db = SessionLocal()
    try:
        # Find the admin user
        admin = db.query(User).filter(User.email == 'admin@lymbus.com').first()
        
        if admin:
            print(f'Found admin user: {admin.email}')
            
            # Generate new password hash
            new_password_hash = get_password_hash('password')
            print(f'New password hash: {new_password_hash[:50]}...')
            
            # Update the password
            admin.hashed_password = new_password_hash
            db.commit()
            
            # Verify the new password works
            is_valid = verify_password('password', admin.hashed_password)
            print(f'Password verification after update: {is_valid}')
            
            print('✅ Admin password updated successfully')
        else:
            print('❌ Admin user not found')
            
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_password() 