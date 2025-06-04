import qrcode
import secrets
import base64
from io import BytesIO
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Guardian, QRCode, Student
from datetime import datetime, timedelta

def generate_unique_code():
    """Genera un código único para el QR."""
    return secrets.token_urlsafe(32)

def create_qr_code(guardian_id: int, student_id: int, expiration_days: int = 30, db: Session = None) -> QRCode:
    """
    Crea un nuevo código QR para un tutor y un estudiante específico.
    
    Args:
        guardian_id: ID del tutor
        student_id: ID del estudiante
        expiration_days: Días hasta la expiración del código
        db: Sesión de base de datos
        
    Returns:
        Objeto QRCode creado
    """
    # Verificar que el tutor existe
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    if not guardian:
        raise ValueError(f"No se encontró un tutor con ID {guardian_id}")
    
    # Verificar que el estudiante existe
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"No se encontró un estudiante con ID {student_id}")
    
    # Generar código único
    unique_code = generate_unique_code()
    
    # Calcular fecha de expiración
    expiration_date = datetime.utcnow() + timedelta(days=expiration_days)
    
    # Crear y guardar el nuevo código QR
    qr_code = QRCode(
        guardian_id=guardian_id,
        student_id=student_id,
        code=unique_code,
        is_active=True,
        expiration_date=expiration_date,
        created_at=datetime.utcnow(),
        expires_at=expiration_date
    )
    
    db.add(qr_code)
    db.commit()
    db.refresh(qr_code)
    
    return qr_code

def generate_qr_image(code: str) -> str:
    """
    Genera una imagen QR a partir de un código.
    
    Args:
        code: Código a convertir en QR
        
    Returns:
        String en formato base64 de la imagen QR
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(code)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return img_str

def validate_qr_code(code: str, db: Session) -> Optional[QRCode]:
    """
    Valida un código QR.
    
    Args:
        code: Código QR a validar
        db: Sesión de base de datos
        
    Returns:
        Objeto QRCode si es válido, None en caso contrario
    """
    qr_code = db.query(QRCode).filter(QRCode.code == code).first()
    
    if not qr_code:
        return None
    
    # Verificar si está activo
    if not qr_code.is_active:
        return None
    
    # Verificar si no ha expirado
    if qr_code.expiration_date and qr_code.expiration_date < datetime.utcnow():
        return None
    
    return qr_code 