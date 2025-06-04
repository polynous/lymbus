#!/usr/bin/env python3
"""
Production-grade data seeding script for Lymbus School Management System
This script creates comprehensive test data in the database for production testing
"""

import os
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine
from app.models import Base, User, Student, School, Classroom, Guardian, Invitation, AccessLog, Notification, GradeLevel, AccessType, AuthorizedBy, guardian_student, Staff
from app.services.auth import get_password_hash
from sqlalchemy import text
import uuid

# Create all tables
Base.metadata.create_all(bind=engine)

# Spanish names for realistic data
FIRST_NAMES_MALE = [
    "Alejandro", "Carlos", "Diego", "Eduardo", "Fernando", "Gabriel", "Hugo", "Javier",
    "Luis", "Manuel", "Nicolas", "Pablo", "Roberto", "Santiago", "Victor", "Miguel",
    "Antonio", "Francisco", "Jose", "Juan", "Pedro", "Rafael", "Alberto", "Daniel",
    "Emilio", "Gonzalo", "Hector", "Ivan", "Jorge", "Leonardo", "Marco", "Oscar",
    "Ricardo", "Sebastian", "Tomas", "Xavier", "Andres", "Bruno", "Cristian", "David"
]

FIRST_NAMES_FEMALE = [
    "Sofia", "Isabella", "Valentina", "Camila", "Lucia", "Elena", "Maria", "Paula",
    "Ana", "Carmen", "Laura", "Patricia", "Sandra", "Monica", "Natalia", "Adriana",
    "Beatriz", "Claudia", "Diana", "Emma", "Fernanda", "Gabriela", "Helena", "Ines",
    "Julia", "Karla", "Lorena", "Marta", "Nuria", "Olivia", "Paola", "Rosa",
    "Sara", "Teresa", "Vanessa", "Ximena", "Yolanda", "Zoe", "Alicia", "Barbara"
]

LAST_NAMES = [
    "Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Hernandez", "Perez", "Sanchez",
    "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Vargas", "Castro",
    "Morales", "Jimenez", "Ruiz", "Ortiz", "Silva", "Mendez", "Cruz", "Reyes",
    "Gutierrez", "Herrera", "Medina", "Aguilar", "Vega", "Campos", "Delgado", "Vazquez",
    "Ramos", "Mendoza", "Guerrero", "Ortega", "Soto", "Chavez", "Romero", "Munoz"
]

# Grade and classroom configurations
GRADE_CONFIGS = [
    {"grade": GradeLevel.KINDER_1, "name": "Kínder 1", "groups": ["A", "B"], "total_students": 30},
    {"grade": GradeLevel.KINDER_2, "name": "Kínder 2", "groups": ["A", "B"], "total_students": 32},
    {"grade": GradeLevel.KINDER_3, "name": "Kínder 3", "groups": ["A", "B"], "total_students": 35},
    {"grade": GradeLevel.PRIMARIA_1, "name": "Primaria 1", "groups": ["A", "B"], "total_students": 38},
    {"grade": GradeLevel.PRIMARIA_2, "name": "Primaria 2", "groups": ["A", "B"], "total_students": 42},
    {"grade": GradeLevel.PRIMARIA_3, "name": "Primaria 3", "groups": ["A", "B"], "total_students": 40},
    {"grade": GradeLevel.PRIMARIA_4, "name": "Primaria 4", "groups": ["A", "B"], "total_students": 36},
    {"grade": GradeLevel.PRIMARIA_5, "name": "Primaria 5", "groups": ["A", "B"], "total_students": 39},
    {"grade": GradeLevel.PRIMARIA_6, "name": "Primaria 6", "groups": ["A", "B"], "total_students": 41}
]

def get_random_phone():
    """Generate a random Spanish phone number"""
    return f"+34 6{random.randint(10, 99)} {random.randint(100, 999)} {random.randint(100, 999)}"

def get_random_vehicle():
    """Generate random vehicle info"""
    brands = ["Toyota", "Honda", "Nissan", "Ford", "Chevrolet", "Volkswagen", "Seat", "Peugeot"]
    colors = ["Blanco", "Negro", "Gris", "Azul", "Rojo", "Verde", "Plata", "Beige"]
    # Spanish license plate format
    letters = "".join(random.choices("BCDFGHJKLMNPRSTVWXYZ", k=3))
    numbers = f"{random.randint(1000, 9999)}"
    return {
        "brand": random.choice(brands),
        "color": random.choice(colors),
        "plate": f"{numbers}{letters}"
    }

def create_school(db):
    """Create the main school"""
    print("Creating school...")
    
    # Check if school exists
    school = db.query(School).first()
    if not school:
        school = School(
            name="Colegio Internacional Lymbus",
            address="Calle Principal 123",
            city="Madrid",
            state="Madrid",
            postal_code="28001",
            country="España",
            phone="+34 91 123 4567",
            email="info@lymbus.edu",
            website="www.lymbus.edu",
            director_name="Dr. Miguel Lopez Torres"
        )
        db.add(school)
        db.commit()
        db.refresh(school)
    
    print("✓ School created")
    return school

def create_admin_users(db):
    """Create admin and system users"""
    print("Creating admin users...")
    
    admin_users = [
        {
            "email": "admin@lymbus.edu",
            "first_name": "Administrador",
            "last_name": "Principal",
            "is_admin": True,
            "is_active": True
        },
        {
            "email": "director@lymbus.edu", 
            "first_name": "Miguel",
            "last_name": "Lopez Torres",
            "is_admin": True,
            "is_active": True
        }
    ]
    
    for admin_data in admin_users:
        existing = db.query(User).filter(User.email == admin_data["email"]).first()
        if not existing:
            admin = User(
                email=admin_data["email"],
                hashed_password=get_password_hash("admin123"),
                first_name=admin_data["first_name"],
                last_name=admin_data["last_name"],
                is_admin=admin_data["is_admin"],
                is_active=admin_data["is_active"]
            )
            db.add(admin)
    
    db.commit()
    print("✓ Admin users created")

def create_staff_users(db, school):
    """Create teacher and staff users"""
    print("Creating staff users...")
    
    staff_positions = [
        {"title": "Profesor/a de Matemáticas", "department": "Académico", "count": 3},
        {"title": "Profesor/a de Lengua", "department": "Académico", "count": 3},
        {"title": "Profesor/a de Ciencias", "department": "Académico", "count": 2},
        {"title": "Profesor/a de Educación Física", "department": "Deportes", "count": 2},
        {"title": "Profesor/a de Inglés", "department": "Idiomas", "count": 2},
        {"title": "Psicólogo/a Escolar", "department": "Psicología", "count": 1},
        {"title": "Secretario/a Académico", "department": "Administración", "count": 2},
        {"title": "Coordinador/a de Nivel", "department": "Administración", "count": 3},
        {"title": "Enfermero/a Escolar", "department": "Salud", "count": 1}
    ]
    
    staff_created = 0
    
    for position in staff_positions:
        for i in range(position["count"]):
            is_female = random.choice([True, False])
            first_name = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
            last_name_parts = f"{random.choice(LAST_NAMES)} {random.choice(LAST_NAMES)}"
            
            email = f"{first_name.lower()}.{last_name_parts.split()[0].lower()}{random.randint(1, 99)}@lymbus.edu"
            
            # Check if user already exists
            if db.query(User).filter(User.email == email).first():
                continue
                
            # Create user
            user = User(
                email=email,
                hashed_password=get_password_hash("staff123"),
                first_name=first_name,
                last_name=last_name_parts,
                is_active=True,
                is_admin=False
            )
            db.add(user)
            db.flush()
            
            # Create staff profile
            staff = Staff(
                user_id=user.id,
                position=position["title"],
                department=position["department"],
                phone=get_random_phone(),
                school_id=school.id
            )
            db.add(staff)
            staff_created += 1
    
    db.commit()
    print(f"✓ {staff_created} staff users created")

def create_classrooms(db, school):
    """Create classrooms for each grade and group"""
    print("Creating classrooms...")
    
    # Clear existing classrooms
    db.query(Classroom).delete()
    db.commit()
    
    classrooms_created = 0
    classrooms_map = {}
    
    for grade_config in GRADE_CONFIGS:
        for group in grade_config["groups"]:
            classroom_name = f"{grade_config['name']} {group}"
            
            classroom = Classroom(
                name=classroom_name,
                grade_level=grade_config["grade"],
                school_id=school.id
            )
            db.add(classroom)
            db.flush()
            
            classrooms_map[classroom_name] = classroom
            classrooms_created += 1
    
    db.commit()
    print(f"✓ {classrooms_created} classrooms created")
    return classrooms_map

def create_students_and_guardians(db, school, classrooms_map):
    """Create students and their guardian users"""
    print("Creating students and guardians...")
    
    student_count = 0
    guardian_count = 0
    
    for grade_config in GRADE_CONFIGS:
        students_per_group = grade_config["total_students"] // len(grade_config["groups"])
        
        for group in grade_config["groups"]:
            classroom_name = f"{grade_config['name']} {group}"
            classroom = classrooms_map.get(classroom_name)
            
            if not classroom:
                continue
            
            for i in range(students_per_group):
                # Create student
                is_female = random.choice([True, False])
                student_first = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
                student_last = f"{random.choice(LAST_NAMES)} {random.choice(LAST_NAMES)}"
                
                # Generate enrollment ID
                enrollment_id = f"LYM{datetime.now().year}{str(student_count + 1).zfill(4)}"
                
                # Random birth date (age appropriate for grade)
                grade_index = next((i for i, g in enumerate(GRADE_CONFIGS) if g['grade'] == grade_config['grade']), 0)
                base_age = 5 + grade_index  # Kínder 1 = 5 years old
                birth_year = datetime.now().year - base_age - random.randint(0, 1)
                birth_month = random.randint(1, 12)
                birth_day = random.randint(1, 28)
                birth_date = datetime(birth_year, birth_month, birth_day).date()
                
                student = Student(
                    first_name=student_first,
                    last_name=student_last,
                    enrollment_id=enrollment_id,
                    date_of_birth=birth_date,
                    gender="F" if is_female else "M",
                    medical_notes=random.choice([
                        None, 
                        "Alergia al polen",
                        "Asma leve", 
                        "Alergia a frutos secos",
                        "Diabetes tipo 1"
                    ]) if random.random() < 0.1 else None,  # 10% have medical conditions
                    school_id=school.id,
                    classroom_id=classroom.id
                )
                db.add(student)
                db.flush()
                
                # Create guardian(s)
                num_guardians = random.choices([1, 2], weights=[30, 70])[0]  # 70% have 2 guardians
                
                for g in range(num_guardians):
                    guardian_is_female = g == 0 or random.choice([True, False])
                    guardian_first = random.choice(FIRST_NAMES_FEMALE if guardian_is_female else FIRST_NAMES_MALE)
                    guardian_last = student_last.split()[0]  # Use first last name
                    
                    guardian_username = f"{guardian_first.lower()}.{guardian_last.lower()}{random.randint(100, 999)}"
                    guardian_email = f"{guardian_username}@email.com"
                    
                    # Check if guardian user already exists by email
                    existing_user = db.query(User).filter(User.email == guardian_email).first()
                    if not existing_user:
                        # Create user for guardian
                        guardian_user = User(
                            email=guardian_email,
                            hashed_password=get_password_hash("parent123"),
                            first_name=guardian_first,
                            last_name=guardian_last,
                            is_active=True,
                            is_admin=False
                        )
                        db.add(guardian_user)
                        db.flush()
                        
                        # Create guardian record
                        guardian = Guardian(
                            user_id=guardian_user.id,
                            relationship_type=random.choice(["Madre", "Padre", "Tutor/a"]),
                            phone=get_random_phone(),
                            address=f"Calle {random.choice(LAST_NAMES)} {random.randint(1, 200)}, Madrid"
                        )
                        db.add(guardian)
                        db.flush()
                        guardian_count += 1
                    else:
                        # Find existing guardian profile
                        guardian = db.query(Guardian).filter(Guardian.user_id == existing_user.id).first()
                        if not guardian:
                            # Create guardian profile for existing user
                            guardian = Guardian(
                                user_id=existing_user.id,
                                relationship_type=random.choice(["Madre", "Padre", "Tutor/a"]),
                                phone=existing_user.phone if hasattr(existing_user, 'phone') else get_random_phone(),
                                address=f"Calle {random.choice(LAST_NAMES)} {random.randint(1, 200)}, Madrid"
                            )
                            db.add(guardian)
                            db.flush()
                            guardian_count += 1
                    
                    # Link guardian to student
                    db.execute(
                        text("INSERT OR IGNORE INTO guardian_student (guardian_id, student_id) VALUES (:guardian_id, :student_id)"),
                        {"guardian_id": guardian.id, "student_id": student.id}
                    )
                
                student_count += 1
    
    db.commit()
    print(f"✓ {student_count} students and {guardian_count} guardians created")

def create_attendance_records(db):
    """Create attendance records for the current week"""
    print("Creating attendance records...")
    
    students = db.query(Student).all()
    today = datetime.now()
    
    access_count = 0
    
    # Create records for the last 5 school days
    for days_ago in range(5):
        date = today - timedelta(days=days_ago)
        
        # Skip weekends
        if date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            continue
            
        for student in students:
            # 95% attendance rate
            is_present = random.random() < 0.95
            
            if is_present:
                # Random arrival time between 7:45 and 8:30
                entry_hour = 7 if random.random() < 0.3 else 8
                entry_minute = random.randint(45, 59) if entry_hour == 7 else random.randint(0, 30)
                entry_time = date.replace(hour=entry_hour, minute=entry_minute, second=0, microsecond=0)
                
                # Create entry access log
                entry_log = AccessLog(
                    student_id=student.id,
                    access_type=AccessType.ENTRADA,
                    timestamp=entry_time,
                    authorized_by=random.choice([AuthorizedBy.QR_CODE, AuthorizedBy.MANUAL])
                )
                db.add(entry_log)
                access_count += 1
                
                # 70% have already exited (or all if not today)
                if random.random() < 0.7 or days_ago > 0:
                    # Random exit time between 14:00 and 16:00
                    exit_hour = random.choices([14, 15, 16], weights=[30, 50, 20])[0]
                    exit_minute = random.randint(0, 59)
                    exit_time = date.replace(hour=exit_hour, minute=exit_minute, second=0, microsecond=0)
                    
                    exit_log = AccessLog(
                        student_id=student.id,
                        access_type=AccessType.SALIDA,
                        timestamp=exit_time,
                        authorized_by=random.choice([AuthorizedBy.QR_CODE, AuthorizedBy.MANUAL, AuthorizedBy.FACIAL_RECOGNITION])
                    )
                    db.add(exit_log)
                    access_count += 1
    
    db.commit()
    print(f"✓ {access_count} attendance records created")

def create_sample_notifications(db):
    """Create sample notifications for users"""
    print("Creating sample notifications...")
    
    notification_templates = [
        {
            "title": "Reunión de Padres",
            "message": "Recordatorio: Reunión de padres mañana a las 17:00 en el salón principal",
            "type": "info"
        },
        {
            "title": "Actividad Extraescolar",
            "message": "Las inscripciones para las actividades extraescolares están abiertas hasta el viernes",
            "type": "info"
        },
        {
            "title": "Salida Temprana",
            "message": "Mañana los estudiantes saldrán a las 13:00 por jornada pedagógica",
            "type": "warning"
        },
        {
            "title": "Nuevo Protocolo de Seguridad",
            "message": "Se ha implementado un nuevo protocolo de seguridad. Por favor revise los detalles.",
            "type": "info"
        },
        {
            "title": "Actualización del Sistema",
            "message": "El sistema de gestión escolar ha sido actualizado con nuevas funcionalidades.",
            "type": "success"
        },
        {
            "title": "Alerta de Asistencia",
            "message": "Algunos estudiantes han sido marcados como ausentes. Por favor verifique.",
            "type": "error"
        }
    ]
    
    users = db.query(User).filter(User.is_active == True).limit(50).all()
    
    notification_count = 0
    for user in users:
        # Create 1-3 notifications per user
        num_notifications = random.randint(1, 3)
        for _ in range(num_notifications):
            template = random.choice(notification_templates)
            
            notification = Notification(
                user_id=user.id,
                title=template["title"],
                message=template["message"],
                type=template["type"],
                read=random.choice([True, False]),
                created_at=datetime.now() - timedelta(
                    days=random.randint(0, 7),
                    hours=random.randint(0, 23)
                )
            )
            db.add(notification)
            notification_count += 1
    
    db.commit()
    print(f"✓ {notification_count} notifications created")

def create_invitations(db):
    """Create pending invitations"""
    print("Creating pending invitations...")
    
    invitation_count = 0
    
    # Create some staff invitations
    for i in range(5):
        email = f"nuevo.profesor{i+1}@email.com"
        existing = db.query(Invitation).filter(Invitation.email == email).first()
        if not existing:
            invitation = Invitation(
                email=email,
                invited_by=1,  # Admin
                invitation_type="staff",
                role="teacher",
                token=str(uuid.uuid4()),
                expires_at=datetime.now() + timedelta(days=7)
            )
            db.add(invitation)
            invitation_count += 1
    
    # Create some parent invitations
    students = db.query(Student).limit(10).all()
    for student in students:
        email = f"nuevo.tutor.{student.id}@email.com"
        existing = db.query(Invitation).filter(Invitation.email == email).first()
        if not existing:
            invitation = Invitation(
                email=email,
                invited_by=1,  # Admin
                invitation_type="guardian",
                role="parent",
                token=str(uuid.uuid4()),
                expires_at=datetime.now() + timedelta(days=7),
                student_id=student.id
            )
            db.add(invitation)
            invitation_count += 1
    
    db.commit()
    print(f"✓ {invitation_count} invitations created")

def main():
    """Main execution function"""
    print("\n🚀 Starting production data seeding for Lymbus School Management System\n")
    
    db = SessionLocal()
    
    try:
        # Create school
        school = create_school(db)
        
        # Create users
        create_admin_users(db)
        create_staff_users(db, school)
        
        # Create school structure
        classrooms = create_classrooms(db, school)
        
        # Create students and guardians
        create_students_and_guardians(db, school, classrooms)
        
        # Create attendance data
        create_attendance_records(db)
        
        # Create additional data
        create_sample_notifications(db)
        create_invitations(db)
        
        print("\n✅ Production data seeding completed successfully!")
        print("\nLogin credentials:")
        print("- Admin: username='admin', password='admin123'")
        print("- Staff: username='[firstname].[lastname][number]', password='staff123'")
        print("- Parents: username='[firstname].[lastname][number]', password='parent123'")
        
        # Print some statistics
        stats = {
            "Total Users": db.query(User).count(),
            "Total Students": db.query(Student).count(),
            "Total Guardians": db.query(Guardian).count(),
            "Total Classrooms": db.query(Classroom).count(),
            "Total Access Logs": db.query(AccessLog).count(),
            "Total Notifications": db.query(Notification).count(),
            "Total Invitations": db.query(Invitation).count()
        }
        
        print("\n📊 Database Statistics:")
        for key, value in stats.items():
            print(f"  - {key}: {value}")
        
    except Exception as e:
        print(f"\n❌ Error during data seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 