from sqlalchemy.orm import Session
from app.models import Student, Guardian, AccessLog, QRCode, AccessType, AuthorizedBy
from app.schemas.access import StudentCheckoutRequest, StudentCheckoutResponse
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from typing import Optional, Tuple
from datetime import datetime
from app.services.qr_service import validate_qr_code

def register_student_entry(
    student_id: int,
    access_type: AccessType,
    guardian_id: Optional[int],
    authorized_by: AuthorizedBy,
    authorized_by_staff_id: Optional[int],
    notes: Optional[str],
    db: Session
) -> Tuple[bool, str, Optional[AccessLog]]:
    """
    Registra la entrada o salida de un alumno.
    
    Args:
        student_id: ID del alumno
        access_type: Tipo de acceso (entrada/salida)
        guardian_id: ID del tutor (opcional)
        authorized_by: Método de autorización
        authorized_by_staff_id: ID del personal que autoriza (opcional)
        notes: Notas adicionales
        db: Sesión de base de datos
        
    Returns:
        Tupla con (éxito, mensaje, registro de acceso)
    """
    # Verificar que el alumno existe
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return False, f"No se encontró un alumno con ID {student_id}", None
    
    # Si hay un tutor, verificar que existe y está asociado al alumno
    if guardian_id:
        guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
        if not guardian:
            return False, f"No se encontró un tutor con ID {guardian_id}", None
        
        # Verificar que el tutor está asociado al alumno
        if student not in guardian.students:
            return False, f"El tutor no está autorizado para este alumno", None
    
    # Crear el registro de acceso
    access_log = AccessLog(
        student_id=student_id,
        access_type=access_type,
        guardian_id=guardian_id,
        authorized_by=authorized_by,
        authorized_by_staff_id=authorized_by_staff_id,
        notes=notes
    )
    
    db.add(access_log)
    db.commit()
    db.refresh(access_log)
    
    # Create notifications for all guardians of the student
    _create_access_notifications(student, access_type, access_log, db)
    
    # Mensaje según el tipo de acceso
    action = "entrada" if access_type == AccessType.ENTRADA else "salida"
    return True, f"Se ha registrado la {action} del alumno {student.full_name()}", access_log

def _create_access_notifications(student: Student, access_type: AccessType, access_log: AccessLog, db: Session):
    """
    Crea notificaciones para todos los tutores de un alumno cuando entra o sale.
    """
    notification_service = NotificationService(db)
    
    # Determinar el tipo de notificación y mensaje
    action_text = "entrada" if access_type == AccessType.ENTRADA else "salida"
    title = f"Registro de {action_text}"
    
    # Obtener la hora en formato legible
    time_str = access_log.timestamp.strftime("%H:%M")
    
    if access_type == AccessType.ENTRADA:
        message = f"{student.full_name()} ha llegado a la escuela a las {time_str}"
        notification_type = "success"
    else:
        message = f"{student.full_name()} ha salido de la escuela a las {time_str}"
        notification_type = "info"
    
    # Crear notificaciones para todos los tutores del alumno
    for guardian in student.guardians:
        if guardian.user:  # Verificar que el tutor tiene un usuario asociado
            try:
                notification_service.create_system_notification(
                    user_id=guardian.user.id,
                    title=title,
                    message=message,
                    notification_type=notification_type
                )
            except Exception as e:
                # Log error but don't fail the access registration
                print(f"Error creating notification for guardian {guardian.id}: {str(e)}")

def process_student_checkout(request: StudentCheckoutRequest, db: Session) -> StudentCheckoutResponse:
    """
    Procesa una solicitud de salida de alumno.
    
    Args:
        request: Datos de la solicitud
        db: Sesión de base de datos
        
    Returns:
        Respuesta con el resultado del proceso
    """
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        return StudentCheckoutResponse(
            success=False,
            message=f"No se encontró un alumno con ID {request.student_id}",
            access_log_id=None
        )
    
    # Si se proporciona un código QR, verificarlo
    if request.qr_code:
        qr_code = validate_qr_code(request.qr_code, db)
        if not qr_code:
            return StudentCheckoutResponse(
                success=False,
                message="Código QR inválido o expirado",
                access_log_id=None
            )
        
        guardian_id = qr_code.guardian_id
        authorized_by = AuthorizedBy.QR_CODE
    
    # Si se proporciona un ID de tutor, usar ese
    elif request.guardian_id:
        guardian_id = request.guardian_id
        authorized_by = AuthorizedBy.MANUAL
    
    # Si hay staff_id, permitir salida manual por personal
    elif request.staff_id:
        guardian_id = None
        authorized_by = AuthorizedBy.MANUAL
    
    # Si no hay método de autorización, rechazar
    else:
        return StudentCheckoutResponse(
            success=False,
            message="Se requiere un método de autorización",
            access_log_id=None
        )
    
    # Registrar la salida
    success, message, access_log = register_student_entry(
        student_id=request.student_id,
        access_type=AccessType.SALIDA,
        guardian_id=guardian_id,
        authorized_by=authorized_by,
        authorized_by_staff_id=request.staff_id,
        notes=None,
        db=db
    )
    
    return StudentCheckoutResponse(
        success=success,
        message=message,
        access_log_id=access_log.id if access_log else None
    )

def get_student_access_logs(student_id: int, limit: int, db: Session):
    """
    Obtiene los registros de acceso de un alumno.
    
    Args:
        student_id: ID del alumno
        limit: Número máximo de registros a devolver
        db: Sesión de base de datos
        
    Returns:
        Lista de registros de acceso
    """
    return db.query(AccessLog).filter(
        AccessLog.student_id == student_id
    ).order_by(
        AccessLog.timestamp.desc()
    ).limit(limit).all() 