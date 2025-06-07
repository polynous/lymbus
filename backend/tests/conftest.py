import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db
from app.models.base import Base
from app.models.user import User, Staff, Guardian
from app.models.school import School, Student, Classroom
from app.models.access import AccessLog, QRCode
from app.models.notification import Notification
from app.services.auth import get_password_hash

# Create a temporary database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a fresh database session for each test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def test_school(db_session):
    """Create a test school"""
    school = School(
        name="Test School",
        address="123 Test St",
        city="Test City",
        state="Test State",
        postal_code="12345",
        country="Test Country",
        phone="555-0123",
        email="test@school.com",
        director_name="Test Director"
    )
    db_session.add(school)
    db_session.commit()
    db_session.refresh(school)
    return school

@pytest.fixture
def test_admin_user(db_session, test_school):
    """Create a test admin user"""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("testpass123"),
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_admin=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create staff profile
    staff = Staff(
        user_id=user.id,
        position="Administrator",
        department="Administration",
        phone="555-0100",
        school_id=test_school.id
    )
    db_session.add(staff)
    db_session.commit()
    
    return user

@pytest.fixture
def test_parent_user(db_session):
    """Create a test parent user"""
    user = User(
        email="parent@test.com",
        hashed_password=get_password_hash("parentpass123"),
        first_name="Parent",
        last_name="User",
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create guardian profile
    guardian = Guardian(
        user_id=user.id,
        relationship_type="padre",
        phone="555-0200",
        address="456 Parent St"
    )
    db_session.add(guardian)
    db_session.commit()
    
    return user

@pytest.fixture
def test_student(db_session, test_school):
    """Create a test student"""
    # Create classroom first
    classroom = Classroom(
        name="Test Classroom",
        grade_level="Primaria 1",
        school_id=test_school.id
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    
    student = Student(
        first_name="Test",
        last_name="Student",
        enrollment_id="TEST001",
        date_of_birth="2015-01-01",
        gender="M",
        school_id=test_school.id,
        classroom_id=classroom.id
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student

@pytest.fixture
def auth_headers_admin(client, test_admin_user):
    """Get authentication headers for admin user"""
    response = client.post(
        "/api/auth/token",
        data={
            "username": test_admin_user.email,
            "password": "testpass123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_parent(client, test_parent_user):
    """Get authentication headers for parent user"""
    response = client.post(
        "/api/auth/token",
        data={
            "username": test_parent_user.email,
            "password": "parentpass123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# Cleanup after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup():
    """Clean up test database after all tests"""
    yield
    # Remove test database file
    if os.path.exists("./test.db"):
        os.remove("./test.db") 