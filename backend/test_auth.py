from app.database import SessionLocal
from app.models.user import User
from app.services.auth import verify_password, authenticate_user

def test_auth():
    db = SessionLocal()
    try:
        # Test user lookup
        user = db.query(User).filter(User.email == 'admin@lymbus.com').first()
        if user:
            print(f'✅ User found: {user.email}')
            print(f'   Active: {user.is_active}')
            print(f'   Admin: {user.is_admin}')
            print(f'   Password hash: {user.hashed_password[:50]}...')
            
            # Test password verification
            is_valid = verify_password('password', user.hashed_password)
            print(f'   Password verification: {is_valid}')
            
            # Test authenticate_user function
            auth_user = authenticate_user(db, 'admin@lymbus.com', 'password')
            print(f'   Authentication result: {auth_user is not None}')
            
        else:
            print('❌ User not found')
            
    finally:
        db.close()

if __name__ == "__main__":
    test_auth() 