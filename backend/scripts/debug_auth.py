import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import asyncio

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import User
from app.services.auth import (
    verify_password, 
    create_access_token, 
    jwt, SECRET_KEY, ALGORITHM,
    get_current_user,
    get_current_active_user
)

async def debug_current_user(token):
    """Test the get_current_user function"""
    db = SessionLocal()
    try:
        print("\n---- Testing get_current_user ----")
        
        class MockToken:
            async def __call__(self):
                return token
        
        # Create mock dependencies
        mock_token = MockToken()
        
        try:
            # Call the get_current_user function
            user = await get_current_user(token=token, db=db)
            print(f"✅ get_current_user successful!")
            print(f"User: {user.email}, {user.first_name} {user.last_name}")
            print(f"Profile type: {'Staff' if user.staff_profile else 'Guardian' if user.guardian_profile else 'None'}")
            
            # Test get_current_active_user
            active_user = await get_current_active_user(current_user=user)
            print(f"✅ get_current_active_user successful!")
            
        except Exception as e:
            print(f"❌ get_current_user or get_current_active_user failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
    finally:
        db.close()

def debug_auth():
    db = SessionLocal()
    try:
        # Fetch a user from the database
        user = db.query(User).filter(User.email == "admin@lymbus.com").first()
        if not user:
            print("User not found! Creating test user...")
            from app.services.auth import get_password_hash
            user = User(
                email="admin@lymbus.com",
                hashed_password=get_password_hash("admin123"),
                first_name="Admin",
                last_name="User",
                is_active=True,
                is_admin=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user: {user.email}")
        else:
            print(f"Found user: {user.email}")
        
        # Generate token
        access_token = create_access_token(data={"sub": user.email})
        print(f"Generated token: {access_token}")
        
        # Validate token
        try:
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"Token payload: {payload}")
            email = payload.get("sub")
            if email == user.email:
                print("✅ Token validation successful!")
            else:
                print(f"❌ Token validation failed! Email mismatch: {email} vs {user.email}")
                
            # Test get_current_user function
            asyncio.run(debug_current_user(access_token))
            
        except Exception as e:
            print(f"❌ Token validation failed: {str(e)}")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_auth() 