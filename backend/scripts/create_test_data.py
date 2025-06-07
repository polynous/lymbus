from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, Guardian, guardian_student
from app.models.school import School, Classroom, Student, GradeLevel
from datetime import date

def create_test_data():
    """Create test data for the application"""
    db = SessionLocal()
    try:
        # Check if we already have data
        students = db.query(Student).count()
        if students > 0:
            print(f"Test data already exists: {students} students found")
            return
        
        # Create a school
        print("Creating test school...")
        school = School(
            name="Test School",
            address="123 Test Street",
            city="Test City",
            state="Test State",
            zipcode="12345",
            phone="123-456-7890",
            email="school@example.com"
        )
        db.add(school)
        db.commit()
        db.refresh(school)
        print(f"✅ School created: {school.name}")
        
        # Create classrooms
        print("Creating classrooms...")
        classrooms = []
        for grade in [GradeLevel.KINDER_1, GradeLevel.KINDER_2, GradeLevel.PRIMARIA_1]:
            classroom = Classroom(
                name=f"Classroom {grade.value}",
                grade_level=grade,
                school_id=school.id
            )
            db.add(classroom)
            db.commit()
            db.refresh(classroom)
            classrooms.append(classroom)
            print(f"✅ Classroom created: {classroom.name}")
        
        # Create students
        print("Creating students...")
        students = []
        for i in range(1, 6):
            classroom = classrooms[i % len(classrooms)]
            student = Student(
                first_name=f"Student{i}",
                last_name=f"Last{i}",
                enrollment_id=f"S00{i}",
                gender="M" if i % 2 == 0 else "F",
                date_of_birth=date(2015, 1, i),
                school_id=school.id,
                classroom_id=classroom.id
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            students.append(student)
            print(f"✅ Student created: {student.first_name} {student.last_name}")
        
        # Create a guardian
        print("Creating guardian...")
        guardian_user = User(
            email="guardian@example.com",
            hashed_password="$2b$12$HxCI3IFNIygw7WAUejIu/.NzRD5U8Gzi6nJAzqOPJpQs0rhJmR5Ri",  # 'password'
            first_name="Parent",
            last_name="User",
            is_active=True
        )
        db.add(guardian_user)
        db.commit()
        db.refresh(guardian_user)
        
        guardian = Guardian(
            user_id=guardian_user.id,
            relationship_type="Father"
        )
        db.add(guardian)
        db.commit()
        db.refresh(guardian)
        
        # Associate guardian with students
        for student in students[:2]:  # First two students
            guardian.students.append(student)
        db.commit()
        print(f"✅ Guardian created and associated with students")
        
        print("✅ Test data created successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data() 