from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, AccessLog as AccessLogModel, AccessType, Student, AuthorizedBy
from app.services.auth import get_current_active_user
from app.services.access_service import register_student_entry, process_student_checkout
from app.schemas.access import AccessLog as AccessLogSchema, StudentCheckoutRequest, StudentCheckoutResponse

router = APIRouter()

@router.post("/entry/{student_id}", response_model=AccessLogSchema)
async def register_entry(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register student entry."""
    
    success, message, access_log = register_student_entry(
        student_id=student_id,
        access_type=AccessType.ENTRADA,
        guardian_id=None,
        authorized_by=AuthorizedBy.MANUAL,
        authorized_by_staff_id=current_user.staff_profile.id if current_user.staff_profile else None,
        notes=None,
        db=db
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return access_log

@router.post("/checkout", response_model=StudentCheckoutResponse)
async def checkout_student(
    request: StudentCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Process student checkout/exit."""
    return process_student_checkout(request, db)

@router.get("/present-students", response_model=List[AccessLogSchema])
async def get_present_students(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Defaults to today."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all students currently present (entry without exit) for a given date."""
    
    if date:
        try:
            query_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        query_date = datetime.now().date()
    
    start_of_day = datetime.combine(query_date, datetime.min.time())
    end_of_day = datetime.combine(query_date, datetime.max.time())
    
    # Get all entry records for the date
    entry_records = db.query(AccessLogModel).filter(
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day
    ).all()
    
    # Get all exit records for the date
    exit_student_ids = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.SALIDA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day
    ).all()
    exit_student_ids = [id[0] for id in exit_student_ids]
    
    # Filter entry records to only include students who haven't exited
    present_students = [
        record for record in entry_records 
        if record.student_id not in exit_student_ids
    ]
    
    return present_students

@router.get("/logs/student/{student_id}", response_model=List[AccessLogSchema])
async def get_student_logs(
    student_id: int,
    limit: int = Query(10, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get access logs for a specific student."""
    
    logs = db.query(AccessLogModel).filter(
        AccessLogModel.student_id == student_id
    ).order_by(
        AccessLogModel.timestamp.desc()
    ).limit(limit).all()
    
    return logs

@router.get("/stats/dashboard", response_model=dict)
async def get_dashboard_stats(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Defaults to today."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics for attendance."""
    
    if date:
        try:
            query_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        query_date = datetime.now().date()
    
    start_of_day = datetime.combine(query_date, datetime.min.time())
    end_of_day = datetime.combine(query_date, datetime.max.time())
    
    # Total students
    total_students = db.query(Student).count()
    
    # Students with entries today
    students_with_entry = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day
    ).distinct().count()
    
    # Students with exits today
    students_with_exit = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.SALIDA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day
    ).distinct().count()
    
    # Currently present (entry but no exit)
    exit_student_ids = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.SALIDA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day
    ).subquery()
    
    currently_present = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= start_of_day,
        AccessLogModel.timestamp <= end_of_day,
        ~AccessLogModel.student_id.in_(exit_student_ids)
    ).distinct().count()
    
    return {
        "date": query_date.isoformat(),
        "total_students": total_students,
        "students_entered": students_with_entry,
        "students_exited": students_with_exit,
        "currently_present": currently_present,
        "absent_today": total_students - students_with_entry
    } 