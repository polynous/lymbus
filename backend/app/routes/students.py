from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Student, AccessLog as AccessLogModel, AccessType
from app.services.auth import get_current_active_user
from app.schemas.access import StudentSearch

router = APIRouter()

@router.get("/search", response_model=List[StudentSearch])
async def search_students(
    query: str = Query(None, description="Búsqueda por nombre o ID"),
    status: Optional[str] = Query(None, description="Filtrar por estado (present/absent)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search students by name or ID, optionally filtering by attendance status."""
    
    # Base query
    students_query = db.query(Student)
    
    # Apply search filters
    if query:
        search_query = f"%{query}%"
        students_query = students_query.filter(
            or_(
                Student.first_name.ilike(search_query),
                Student.last_name.ilike(search_query),
                Student.enrollment_id.ilike(search_query),
                Student.id == query if query.isdigit() else False
            )
        )
    
    # Apply status filter
    if status:
        today = AccessLogModel.get_today_date()
        tomorrow = today + timedelta(days=1)
        
        if status.lower() == 'present':
            # Students with entry but no exit today
            students_with_entry = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.ENTRADA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).subquery()
            
            students_with_exit = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.SALIDA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).subquery()
            
            students_query = students_query.filter(
                Student.id.in_(students_with_entry)
            ).filter(
                ~Student.id.in_(students_with_exit)
            )
            
        elif status.lower() == 'absent':
            # Students without entry today
            present_student_ids = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.ENTRADA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).all()
            present_student_ids = [id[0] for id in present_student_ids]
            
            students_query = students_query.filter(~Student.id.in_(present_student_ids))
    
    students = students_query.all()
    
    # Format response
    results = []
    for student in students:
        guardians = []
        for guardian in student.guardians:
            guardian_data = {
                "id": guardian.id,
                "first_name": guardian.user.first_name,
                "last_name": guardian.user.last_name,
                "relationship_type": guardian.relationship_type
            }
            guardians.append(guardian_data)
        
        student_data = {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "enrollment_id": student.enrollment_id,
            "grade_level": {"name": "No asignado"}
        }
        
        # Add grade level safely
        try:
            if student.classroom and student.classroom.grade_level:
                student_data["grade_level"] = {"name": student.classroom.grade_level.value}
        except (AttributeError, TypeError, LookupError) as e:
            print(f"Error getting grade_level for student {student.id}: {str(e)}")
        
        student_data["guardians"] = guardians
        results.append(student_data)
    
    return results

@router.get("/{student_id}", response_model=dict)
async def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific student."""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get guardians
    guardians = []
    for guardian in student.guardians:
        guardian_data = {
            "id": guardian.id,
            "first_name": guardian.user.first_name,
            "last_name": guardian.user.last_name,
            "email": guardian.user.email,
            "phone": guardian.user.phone,
            "relationship_type": guardian.relationship_type
        }
        guardians.append(guardian_data)
    
    # Get today's attendance status
    today = AccessLogModel.get_today_date()
    tomorrow = today + timedelta(days=1)
    
    entry_log = db.query(AccessLogModel).filter(
        AccessLogModel.student_id == student_id,
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= today,
        AccessLogModel.timestamp < tomorrow
    ).first()
    
    exit_log = db.query(AccessLogModel).filter(
        AccessLogModel.student_id == student_id,
        AccessLogModel.access_type == AccessType.SALIDA,
        AccessLogModel.timestamp >= today,
        AccessLogModel.timestamp < tomorrow
    ).first()
    
    attendance_status = "absent"
    if entry_log and not exit_log:
        attendance_status = "present"
    elif entry_log and exit_log:
        attendance_status = "completed"
    
    student_data = {
        "id": student.id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "full_name": f"{student.first_name} {student.last_name}",
        "enrollment_id": student.enrollment_id,
        "guardians": guardians,
        "attendance_status": attendance_status,
        "entry_time": entry_log.timestamp.isoformat() if entry_log else None,
        "exit_time": exit_log.timestamp.isoformat() if exit_log else None
    }
    
    # Add grade level safely
    try:
        if student.classroom and student.classroom.grade_level:
            student_data["grade_level"] = student.classroom.grade_level.value
    except (AttributeError, TypeError, LookupError):
        student_data["grade_level"] = "No asignado"
    
    return student_data

@router.get("/{student_id}/guardians", response_model=List[dict])
async def get_student_guardians(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all guardians for a specific student."""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    guardians = []
    for guardian in student.guardians:
        guardian_data = {
            "id": guardian.id,
            "first_name": guardian.user.first_name,
            "last_name": guardian.user.last_name,
            "email": guardian.user.email,
            "phone": guardian.user.phone,
            "relationship_type": guardian.relationship_type
        }
        guardians.append(guardian_data)
    
    return guardians 