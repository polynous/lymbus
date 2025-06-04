#!/usr/bin/env python3
"""
Script to create test students and access logs for demonstration.
Run this from the backend directory: python create_test_students.py
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import Student, AccessLog, AccessType, AuthorizedBy
from app.models.school import Classroom, GradeLevel

def create_test_data():
    db = SessionLocal()
    
    try:
        print("Creating test students and access logs...")
        
        # Check if students already exist
        existing_students = db.query(Student).count()
        print(f"Existing students in database: {existing_students}")
        
        if existing_students < 5:
            # Create some test students
            test_students = [
                {
                    "first_name": "Ana", 
                    "last_name": "García",
                    "enrollment_id": "2024001"
                },
                {
                    "first_name": "Carlos", 
                    "last_name": "López",
                    "enrollment_id": "2024002"
                },
                {
                    "first_name": "María", 
                    "last_name": "Rodríguez",
                    "enrollment_id": "2024003"
                },
                {
                    "first_name": "Diego", 
                    "last_name": "Martínez",
                    "enrollment_id": "2024004"
                },
                {
                    "first_name": "Sofía", 
                    "last_name": "Hernández",
                    "enrollment_id": "2024005"
                },
                {
                    "first_name": "Luis", 
                    "last_name": "González",
                    "enrollment_id": "2024006"
                },
                {
                    "first_name": "Elena", 
                    "last_name": "Pérez",
                    "enrollment_id": "2024007"
                },
                {
                    "first_name": "Tomás", 
                    "last_name": "Sánchez",
                    "enrollment_id": "2024008"
                }
            ]
            
            created_students = []
            for student_data in test_students:
                # Check if student already exists
                existing = db.query(Student).filter(
                    Student.enrollment_id == student_data["enrollment_id"]
                ).first()
                
                if not existing:
                    student = Student(
                        first_name=student_data["first_name"],
                        last_name=student_data["last_name"],
                        enrollment_id=student_data["enrollment_id"],
                        gender="M" if student_data["first_name"] in ["Carlos", "Diego", "Luis", "Tomás"] else "F",
                        date_of_birth=datetime.now().date() - timedelta(days=365*8)  # 8 years old
                    )
                    db.add(student)
                    created_students.append(student)
                    print(f"Created student: {student_data['first_name']} {student_data['last_name']}")
                else:
                    created_students.append(existing)
                    print(f"Student already exists: {student_data['first_name']} {student_data['last_name']}")
            
            db.commit()
            
            # Refresh all students to get their IDs
            for student in created_students:
                db.refresh(student)
        else:
            # Get existing students
            created_students = db.query(Student).limit(8).all()
            print(f"Using existing students: {len(created_students)} found")
        
        # Create some test access logs for today
        today = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
        
        # Create entry logs for some students (simulating they arrived this morning)
        entry_times = [
            today + timedelta(minutes=0),   # 8:00 AM
            today + timedelta(minutes=15),  # 8:15 AM  
            today + timedelta(minutes=30),  # 8:30 AM
            today + timedelta(minutes=45),  # 8:45 AM
            today + timedelta(minutes=60),  # 9:00 AM
        ]
        
        students_with_entries = []
        for i, student in enumerate(created_students[:5]):  # First 5 students enter
            # Check if entry already exists for today
            existing_entry = db.query(AccessLog).filter(
                AccessLog.student_id == student.id,
                AccessLog.access_type == AccessType.ENTRADA,
                AccessLog.timestamp >= today.date()
            ).first()
            
            if not existing_entry:
                entry_log = AccessLog(
                    student_id=student.id,
                    access_type=AccessType.ENTRADA,
                    timestamp=entry_times[i],
                    authorized_by=AuthorizedBy.MANUAL,
                    notes="Entrada registrada por personal"
                )
                db.add(entry_log)
                students_with_entries.append(student)
                print(f"Created entry log for {student.first_name} {student.last_name} at {entry_times[i].strftime('%H:%M')}")
            else:
                students_with_entries.append(student)
                print(f"Entry already exists for {student.first_name} {student.last_name}")
        
        # Create some exit logs (simulating some students left early)
        exit_time = today + timedelta(hours=6)  # 2:00 PM
        for i, student in enumerate(students_with_entries[:2]):  # First 2 students exit
            # Check if exit already exists for today
            existing_exit = db.query(AccessLog).filter(
                AccessLog.student_id == student.id,
                AccessLog.access_type == AccessType.SALIDA,
                AccessLog.timestamp >= today.date()
            ).first()
            
            if not existing_exit:
                exit_log = AccessLog(
                    student_id=student.id,
                    access_type=AccessType.SALIDA,
                    timestamp=exit_time + timedelta(minutes=i*10),
                    authorized_by=AuthorizedBy.MANUAL,
                    notes="Salida registrada por personal"
                )
                db.add(exit_log)
                print(f"Created exit log for {student.first_name} {student.last_name} at {(exit_time + timedelta(minutes=i*10)).strftime('%H:%M')}")
            else:
                print(f"Exit already exists for {student.first_name} {student.last_name}")
        
        db.commit()
        
        # Summary
        total_students = db.query(Student).count()
        total_entries_today = db.query(AccessLog).filter(
            AccessLog.access_type == AccessType.ENTRADA,
            AccessLog.timestamp >= today.date()
        ).count()
        total_exits_today = db.query(AccessLog).filter(
            AccessLog.access_type == AccessType.SALIDA,
            AccessLog.timestamp >= today.date()
        ).count()
        
        print(f"\n✅ Test data creation completed!")
        print(f"📊 Summary:")
        print(f"   - Total students: {total_students}")
        print(f"   - Entries today: {total_entries_today}")
        print(f"   - Exits today: {total_exits_today}")
        print(f"   - Students currently present: {total_entries_today - total_exits_today}")
        
    except Exception as e:
        print(f"❌ Error creating test data: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data() 