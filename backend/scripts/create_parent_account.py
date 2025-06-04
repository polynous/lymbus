import sys
import os
from passlib.context import CryptContext
from sqlalchemy import text

# Add root directory to path to import application modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import User, Guardian, Student, guardian_student
from sqlalchemy import insert, or_

# Password hash configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_parent_account():
    db = SessionLocal()
    try:
        # Check if parent already exists
        email = "parent@example.com"
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            print(f"Parent account already exists with email: {email}")
            
            # Check if guardian profile exists
            guardian = db.query(Guardian).filter(Guardian.user_id == existing_user.id).first()
            if not guardian:
                print("Creating guardian profile for existing user...")
                guardian = Guardian(
                    user_id=existing_user.id,
                    relationship_type="padre",
                    phone="555-123-4567"
                )
                db.add(guardian)
                db.flush()
            else:
                print(f"Guardian profile exists with ID: {guardian.id}")
                
            user_id = existing_user.id
            guardian_id = guardian.id
        else:
            # Create new parent account with known credentials
            password = "parent123"
            hashed_password = pwd_context.hash(password)
            
            new_user = User(
                email=email,
                hashed_password=hashed_password,
                first_name="Parent",
                last_name="Example",
                is_active=True,
                is_admin=False
            )
            db.add(new_user)
            db.flush()
            
            # Create guardian profile
            guardian = Guardian(
                user_id=new_user.id,
                relationship_type="padre",
                phone="555-123-4567"
            )
            db.add(guardian)
            db.flush()
            
            user_id = new_user.id
            guardian_id = guardian.id
            
            print(f"Created new parent account with email: {email} and password: {password}")
        
        # Get students to associate with this guardian
        students = db.query(Student).limit(3).all()
        
        if not students:
            print("No students found in database!")
            return
        
        # Associate guardian with students
        for student in students:
            # Check if association already exists using sqlalchemy properly
            query = text(f"SELECT * FROM guardian_student WHERE guardian_id = :guardian_id AND student_id = :student_id")
            association = db.execute(query, {"guardian_id": guardian_id, "student_id": student.id}).fetchone()
            
            if not association:
                print(f"Associating guardian with student: {student.first_name} {student.last_name}")
                db.execute(
                    insert(guardian_student).values(
                        guardian_id=guardian_id, 
                        student_id=student.id
                    )
                )
        
        db.commit()
        
        print("\nParent account details:")
        print(f"Email: {email}")
        print(f"Password: parent123")
        
        # Get associated students for confirmation
        associated_students = db.query(Student).join(guardian_student).filter(guardian_student.c.guardian_id == guardian_id).all()
        if associated_students:
            print("\nAssociated students:")
            for student in associated_students:
                print(f"- {student.first_name} {student.last_name} (ID: {student.id})")
        else:
            print("\nNo students associated with this parent!")
            
    except Exception as e:
        print(f"Error creating parent account: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_parent_account() 