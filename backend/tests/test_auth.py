import pytest
from fastapi import status
from app.services.auth import get_password_hash, verify_password, create_access_token
from app.models.user import User
from datetime import timedelta

class TestAuthService:
    """Test authentication service functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        # Hash should be different from original password
        assert hashed != password
        
        # Verification should work
        assert verify_password(password, hashed) == True
        
        # Wrong password should fail
        assert verify_password("wrongpassword", hashed) == False
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_expiry(self):
        """Test JWT token creation with custom expiry"""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)
        
        assert token is not None
        assert isinstance(token, str)

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_success(self, client, test_admin_user):
        """Test successful login"""
        response = client.post(
            "/api/auth/token",
            data={
                "username": test_admin_user.email,
                "password": "testpass123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, test_admin_user):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/token",
            data={
                "username": test_admin_user.email,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post(
            "/api/auth/token",
            data={
                "username": "nonexistent@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        # Missing password
        response = client.post(
            "/api/auth/token",
            data={"username": "test@example.com"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Missing username
        response = client.post(
            "/api/auth/token",
            data={"password": "password123"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_current_user_success(self, client, auth_headers_admin, test_admin_user):
        """Test getting current user with valid token"""
        response = client.get("/api/auth/users/me", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_admin_user.email
        assert data["first_name"] == test_admin_user.first_name
        assert data["last_name"] == test_admin_user.last_name
        assert data["is_admin"] == test_admin_user.is_admin
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalidtoken"}
        response = client.get("/api/auth/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/auth/users/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_expired_token(self, client, test_admin_user):
        """Test getting current user with expired token"""
        # Create token with very short expiry
        expired_token = create_access_token(
            data={"sub": test_admin_user.email},
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/auth/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

class TestUserPermissions:
    """Test user permission and role-based access"""
    
    def test_admin_user_properties(self, test_admin_user):
        """Test admin user has correct properties"""
        assert test_admin_user.is_admin == True
        assert test_admin_user.is_active == True
        assert test_admin_user.staff_profile is not None
    
    def test_parent_user_properties(self, test_parent_user):
        """Test parent user has correct properties"""
        assert test_parent_user.is_admin == False
        assert test_parent_user.is_active == True
        assert test_parent_user.guardian_profile is not None
    
    def test_inactive_user_login(self, client, db_session):
        """Test that inactive users cannot login"""
        # Create inactive user
        inactive_user = User(
            email="inactive@test.com",
            hashed_password=get_password_hash("password123"),
            first_name="Inactive",
            last_name="User",
            is_active=False,
            is_admin=False
        )
        db_session.add(inactive_user)
        db_session.commit()
        
        response = client.post(
            "/api/auth/token",
            data={
                "username": inactive_user.email,
                "password": "password123"
            }
        )
        
        # User exists but is inactive, so login should fail
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

class TestPasswordSecurity:
    """Test password security requirements"""
    
    def test_password_hash_uniqueness(self):
        """Test that same password generates different hashes"""
        password = "samepassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        
        # But both should verify correctly
        assert verify_password(password, hash1) == True
        assert verify_password(password, hash2) == True
    
    def test_empty_password_handling(self):
        """Test handling of empty passwords"""
        # Empty password should be hashable but not verifiable
        empty_hash = get_password_hash("")
        assert empty_hash is not None
        assert verify_password("", empty_hash) == True
        assert verify_password("notEmpty", empty_hash) == False
    
    def test_special_characters_in_password(self):
        """Test passwords with special characters"""
        special_password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?"
        hashed = get_password_hash(special_password)
        
        assert verify_password(special_password, hashed) == True
        assert verify_password("P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>!", hashed) == False
    
    def test_unicode_password(self):
        """Test passwords with unicode characters"""
        unicode_password = "contraseña🔒🎓"
        hashed = get_password_hash(unicode_password)
        
        assert verify_password(unicode_password, hashed) == True 