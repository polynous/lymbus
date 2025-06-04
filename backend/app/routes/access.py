from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_, func
from datetime import datetime, time, timedelta, timezone
import os
import json
import qrcode
from io import BytesIO
import base64

from app.database import get_db
from app.models import User, AccessType, AuthorizedBy, Student, AccessLog as AccessLogModel, Guardian, QRCode
from app.services.auth import get_current_active_user, get_password_hash
from app.services.access_service import (
    register_student_entry,
    process_student_checkout,
    get_student_access_logs
)
from app.services.qr_service import create_qr_code, generate_qr_image
from app.schemas.access import (
    AccessLog as AccessLogSchema,
    QRCode as QRCodeSchema,
    StudentCheckoutRequest,
    StudentCheckoutResponse,
    StudentSearch
)
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.models.school import Classroom, GradeLevel

router = APIRouter()

@router.get("/search-students", response_model=List[StudentSearch])
async def search_students(
    query: str = Query(None, description="Búsqueda por nombre o ID"),
    status: Optional[str] = Query(None, description="Filtrar por estado (present/absent)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Busca estudiantes por nombre o ID, opcionalmente filtrando por estado de presencia.
    Si no se proporciona un término de búsqueda pero se especifica status=present,
    se devolverán todos los estudiantes presentes.
    """
    # Base query
    students_query = db.query(Student)
    
    # Si hay una búsqueda, aplicar filtros de búsqueda
    if query:
        search_query = f"%{query}%"
        students_query = students_query.filter(
            or_(
                Student.first_name.ilike(search_query),
                Student.last_name.ilike(search_query),
                Student.enrollment_id.ilike(search_query),
                # También podríamos buscar por ID numérico si es un número
                Student.id == query if query.isdigit() else False
            )
        )
    
    # Si se solicita filtrar por estado de presencia
    if status:
        # Get today's date for filtering
        today = AccessLogModel.get_today_date()
        tomorrow = today + timedelta(days=1)
        
        if status.lower() == 'present':
            # Get students with entry records for today
            students_with_entry = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.ENTRADA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).subquery()
            
            # Get students with exit records for today
            students_with_exit = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.SALIDA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).subquery()
            
            # Only return students who have an entry record but NO exit record for today
            students_query = students_query.filter(
                Student.id.in_(students_with_entry)
            ).filter(
                ~Student.id.in_(students_with_exit)
            )
            
        elif status.lower() == 'absent':
            # Subconsulta para obtener IDs de estudiantes con entrada hoy
            present_student_ids = db.query(AccessLogModel.student_id).filter(
                AccessLogModel.access_type == AccessType.ENTRADA,
                AccessLogModel.timestamp >= today,
                AccessLogModel.timestamp < tomorrow
            ).all()
            present_student_ids = [id[0] for id in present_student_ids]
            
            # Filtrar solo estudiantes ausentes
            students_query = students_query.filter(~Student.id.in_(present_student_ids))
    
    # Obtener los resultados
    students = students_query.all()
    
    # Preparar respuesta con los tutores de cada estudiante
    results = []
    for student in students:
        # Obtener tutores asociados a este estudiante
        guardians = []
        for guardian in student.guardians:
            guardian_data = {
                "id": guardian.id,
                "first_name": guardian.user.first_name,
                "last_name": guardian.user.last_name,
                "relationship_type": guardian.relationship_type
            }
            guardians.append(guardian_data)
        
        # Crear objeto de estudiante con sus tutores
        student_data = {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "enrollment_id": student.enrollment_id,
            "grade_level": {"name": "No asignado"}
        }
        
        # Add grade level safely to avoid enum errors
        try:
            if student.classroom and student.classroom.grade_level:
                student_data["grade_level"] = {"name": student.classroom.grade_level.value}
        except (AttributeError, TypeError, LookupError) as e:
            # Log error but continue without failing
            print(f"Error al obtener grade_level para estudiante {student.id}: {str(e)}")
        
        # Add guardians
        student_data["guardians"] = guardians
        results.append(student_data)
    
    return results

@router.post("/checkout", response_model=StudentCheckoutResponse)
async def checkout_student(
    request: StudentCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Procesa la salida de un estudiante."""
    return process_student_checkout(request, db)

@router.post("/entry/{student_id}", response_model=AccessLogSchema)
async def register_entry(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Registra la entrada de un estudiante."""
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return access_log

@router.get("/logs/student/{student_id}", response_model=List[AccessLogSchema])
async def get_student_logs(
    student_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los registros de acceso de un estudiante."""
    return get_student_access_logs(student_id, limit, db)

@router.post("/qrcode/generate/{guardian_id}", response_model=dict)
async def generate_guardian_qrcode(
    guardian_id: int,
    expiration_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Genera un nuevo código QR para un tutor."""
    try:
        qr_code = create_qr_code(guardian_id, db, expiration_days)
        qr_image = generate_qr_image(qr_code.code)
        
        return {
            "qr_code": qr_code,
            "qr_image": qr_image
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/present-students", response_model=List[AccessLogSchema])
async def get_present_students(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Defaults to today."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene la lista de estudiantes presentes en una fecha determinada.
    """
    # Si no se especifica fecha, usar hoy
    if not date:
        today = AccessLogModel.get_today_date()
    else:
        # Convertir la fecha de string a datetime
        try:
            parsed_date = datetime.strptime(date, '%Y-%m-%d')
            # Create a timezone-aware datetime
            today = datetime.combine(parsed_date.date(), time.min).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de fecha inválido. Use YYYY-MM-DD."
            )
    
    # Obtener todas las entradas de hoy
    tomorrow = today + timedelta(days=1)
    access_logs = db.query(AccessLogModel).filter(
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= today,
        AccessLogModel.timestamp < tomorrow
    ).all()
    
    return access_logs

@router.get("/stats/dashboard", response_model=dict)
async def get_dashboard_stats(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Defaults to today."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene estadísticas para el dashboard:
    - Total de estudiantes registrados
    - Estudiantes presentes
    - Total de entradas
    - Total de salidas
    """
    # Si no se especifica fecha, usar hoy
    if not date:
        today = AccessLogModel.get_today_date()
    else:
        # Convertir la fecha de string a datetime
        try:
            parsed_date = datetime.strptime(date, '%Y-%m-%d')
            # Create a timezone-aware datetime
            today = datetime.combine(parsed_date.date(), time.min).replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de fecha inválido. Use YYYY-MM-DD."
            )
    
    # Calcular el día siguiente
    tomorrow = today + timedelta(days=1)
    
    # Get total number of students in the system
    total_students = db.query(Student).count()
    
    # Get the count of distinct students who entered today
    entry_students = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.ENTRADA,
        AccessLogModel.timestamp >= today,
        AccessLogModel.timestamp < tomorrow
    ).distinct().all()
    total_entries = len(entry_students)
    
    # Get the count of distinct students who exited today
    exit_students = db.query(AccessLogModel.student_id).filter(
        AccessLogModel.access_type == AccessType.SALIDA,
        AccessLogModel.timestamp >= today,
        AccessLogModel.timestamp < tomorrow
    ).distinct().all()
    total_exits = len(exit_students)
    
    # Count students currently present (entered but not exited)
    entry_ids = set([entry[0] for entry in entry_students])
    exit_ids = set([exit[0] for exit in exit_students])
    students_present = len(entry_ids - exit_ids)
    
    return {
        "totalStudents": total_students,
        "studentsPresent": students_present,
        "totalEntries": total_entries,
        "totalExits": total_exits
    }

@router.get("/student/{student_id}", response_model=dict)
async def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los detalles de un estudiante."""
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Check permissions (staff can view any student, guardians only their students)
    if (not current_user.staff_profile and 
        not any(guardian.user_id == current_user.id for guardian in student.guardians)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este estudiante"
        )
    
    # Build response
    result = {
        "id": student.id,
        "enrollment_id": student.enrollment_id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "full_name": f"{student.first_name} {student.last_name}",
        "gender": student.gender,
        "date_of_birth": student.date_of_birth,
        "medical_notes": student.medical_notes,
        "created_at": student.created_at
    }
    
    # Add address and emergency_phone fields if they exist
    if hasattr(student, 'address'):
        result["address"] = student.address
    if hasattr(student, 'emergency_phone'):
        result["emergency_phone"] = student.emergency_phone
    
    # Add classroom and grade level safely
    try:
        if student.classroom:
            result["classroom"] = {
                "id": student.classroom.id,
                "name": student.classroom.name
            }
            if student.classroom.grade_level:
                result["classroom"]["grade_level"] = {
                    "name": student.classroom.grade_level.value
                }
    except (AttributeError, TypeError, LookupError) as e:
        print(f"Error al obtener datos de aula para estudiante {student.id}: {str(e)}")
        result["classroom"] = None
    
    return result

@router.get("/student/{student_id}/logs", response_model=List[dict])
async def get_student_access_logs_endpoint(
    student_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los registros de acceso de un estudiante."""
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Check permissions (staff can view any student, guardians only their students)
    if (not current_user.staff_profile and 
        not any(guardian.user_id == current_user.id for guardian in student.guardians)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver los registros de este estudiante"
        )
    
    # Get access logs
    logs = db.query(AccessLogModel).filter(
        AccessLogModel.student_id == student_id
    ).order_by(AccessLogModel.timestamp.desc()).limit(limit).all()
    
    # Format logs for response
    result = []
    for log in logs:
        log_data = {
            "id": log.id,
            "type": log.access_type,
            "timestamp": log.timestamp,
            "notes": log.notes,
            "authorized_by": log.authorized_by
        }
        
        # Add guardian info if available
        if log.guardian:
            log_data["picked_up_by"] = {
                "id": log.guardian.id,
                "full_name": f"{log.guardian.user.first_name} {log.guardian.user.last_name}",
                "relationship": log.guardian.relationship_type
            }
        
        result.append(log_data)
    
    return result

@router.get("/student/{student_id}/guardians", response_model=List[dict])
async def get_student_guardians(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los tutores de un estudiante."""
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    # Check permissions (staff can view any student, guardians only their students)
    if (not current_user.staff_profile and 
        not any(guardian.user_id == current_user.id for guardian in student.guardians)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver los tutores de este estudiante"
        )
    
    # Format guardian data
    result = []
    for guardian in student.guardians:
        guardian_data = {
            "id": guardian.id,
            "full_name": f"{guardian.user.first_name} {guardian.user.last_name}",
            "relationship": guardian.relationship_type,
            "email": guardian.user.email,
            "phone": guardian.user.phone
        }
        result.append(guardian_data)
    
    return result

@router.get("/guardian/students", response_model=List[dict])
async def get_guardian_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los estudiantes asociados al tutor actual."""
    if not current_user.guardian_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ruta es solo para tutores"
        )
    
    guardian_id = current_user.guardian_profile.id
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de tutor no encontrado"
        )
    
    # Format student data
    result = []
    for student in guardian.students:
        student_data = {
            "id": student.id,
            "enrollment_id": student.enrollment_id,
            "full_name": f"{student.first_name} {student.last_name}",
        }
        
        # Add classroom and grade level safely
        try:
            if student.classroom and student.classroom.grade_level:
                student_data["grade"] = student.classroom.grade_level.value
                student_data["classroom"] = student.classroom.name
        except (AttributeError, TypeError, LookupError) as e:
            print(f"Error al obtener datos de aula para estudiante {student.id}: {str(e)}")
        
        result.append(student_data)
    
    return result

@router.get("/qr-codes", response_model=List[dict])
async def get_guardian_qr_codes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene los códigos QR del tutor actual."""
    if not current_user.guardian_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ruta es solo para tutores"
        )
    
    guardian_id = current_user.guardian_profile.id
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de tutor no encontrado"
        )
    
    # Get QR codes from the guardian
    qr_codes = db.query(QRCode).filter(QRCode.guardian_id == guardian_id).all()
    
    result = []
    for qr in qr_codes:
        student = db.query(Student).filter(Student.id == qr.student_id).first()
        if student:
            qr_data = {
                "id": qr.id,
                "code": qr.code,
                "created_at": qr.created_at,
                "expires_at": qr.expires_at or qr.expiration_date,
                "student": {
                    "id": student.id,
                    "full_name": f"{student.first_name} {student.last_name}",
                    "enrollment_id": student.enrollment_id
                }
            }
            result.append(qr_data)
    
    return result

@router.post("/qr-codes/generate", response_model=dict)
async def generate_qr_code(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Genera un código QR para autorizar la recogida de un estudiante."""
    if not current_user.guardian_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ruta es solo para tutores"
        )
    
    student_id = request.get("student_id")
    expiration_days = request.get("expiration_days", 1)
    
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere el ID del estudiante"
        )
    
    guardian_id = current_user.guardian_profile.id
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de tutor no encontrado"
        )
    
    # Verify student belongs to guardian
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    if student not in guardian.students:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para generar códigos para este estudiante"
        )
    
    # Create QR code
    try:
        qr_code = create_qr_code(guardian_id, student_id, expiration_days, db)
        qr_image = generate_qr_image(qr_code.code)
        
        return {
            "id": qr_code.id,
            "code": qr_code.code,
            "created_at": qr_code.created_at,
            "expires_at": qr_code.expires_at,
            "qr_image": qr_image,
            "student": {
                "id": student.id,
                "full_name": f"{student.first_name} {student.last_name}",
                "enrollment_id": student.enrollment_id
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el código QR: {str(e)}"
        )

@router.post("/qr-codes/{qr_id}/revoke", response_model=dict)
async def revoke_qr_code(
    qr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Revoca un código QR generado previamente."""
    if not current_user.guardian_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta ruta es solo para tutores"
        )
    
    # Get QR code
    qr_code = db.query(QRCode).filter(QRCode.id == qr_id).first()
    
    if not qr_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código QR no encontrado"
        )
    
    # Check ownership
    if qr_code.guardian_id != current_user.guardian_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para revocar este código QR"
        )
    
    # Revoke QR code
    qr_code.is_revoked = True
    db.commit()
    
    return {"success": True, "message": "Código QR revocado correctamente"}

@router.get("/all-students", response_model=List[dict])
async def get_all_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene la lista de todos los estudiantes."""
    # Solo personal autorizado puede ver todos los estudiantes
    if not current_user.staff_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver todos los estudiantes"
        )
    
    # Obtener todos los estudiantes activos
    students = db.query(Student).filter(Student.is_active == True).all()
    
    # Formatear resultados
    results = []
    for student in students:
        student_data = {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "full_name": f"{student.first_name} {student.last_name}",
            "enrollment_id": student.enrollment_id,
            "grade_level": {"name": "No asignado"}
        }
        
        # Add grade level safely
        try:
            if student.classroom and student.classroom.grade_level:
                student_data["grade_level"] = {"name": student.classroom.grade_level.value}
        except (AttributeError, TypeError, LookupError) as e:
            print(f"Error al obtener grade_level para estudiante {student.id}: {str(e)}")
        
        results.append(student_data)
    
    return results

@router.get("/users/", response_model=List[UserSchema])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_user

@router.post("/users/", response_model=UserSchema)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user with this email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Create User object and set properties
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=True,
        is_admin=user.is_admin if hasattr(user, 'is_admin') else False
    )
    
    # Add to DB and commit
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return None 