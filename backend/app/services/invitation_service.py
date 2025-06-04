from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from app.models import Invitation, InvitationType, User, Guardian, Staff
from app.services.auth import get_password_hash
from app.schemas.invitation import InvitationCreate
from app.core.config import settings

def create_invitation(
    db: Session, 
    invitation: InvitationCreate, 
    created_by_id: int
) -> Invitation:
    """
    Crea una nueva invitación.
    
    Args:
        db: Sesión de base de datos
        invitation: Datos de la invitación
        created_by_id: ID del usuario que crea la invitación
        
    Returns:
        Invitación creada
    """
    # Generar token y fecha de expiración
    token = Invitation.generate_token()
    expires_at = Invitation.generate_expiration_date()
    
    # Crear objeto de invitación
    db_invitation = Invitation(
        email=invitation.email,
        token=token,
        invitation_type=InvitationType(invitation.invitation_type.value),
        is_used=False,
        expires_at=expires_at,
        created_by_id=created_by_id,
        school_id=invitation.school_id,
        student_id=invitation.student_id,
        relationship_type=invitation.relationship_type,
        position=invitation.position,
        department=invitation.department
    )
    
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    
    return db_invitation

def get_invitation_by_token(db: Session, token: str) -> Optional[Invitation]:
    """
    Obtiene una invitación por su token.
    
    Args:
        db: Sesión de base de datos
        token: Token de la invitación
        
    Returns:
        Invitación si existe, None en caso contrario
    """
    return db.query(Invitation).filter(Invitation.token == token).first()

def is_invitation_valid(invitation: Invitation) -> bool:
    """
    Verifica si una invitación es válida.
    
    Args:
        invitation: Invitación a verificar
        
    Returns:
        True si es válida, False en caso contrario
    """
    if not invitation:
        return False
    
    if invitation.is_used:
        return False
    
    if invitation.expires_at < datetime.utcnow():
        return False
    
    return True

def complete_registration(
    db: Session,
    token: str,
    first_name: str,
    last_name: str,
    password: str,
    phone: Optional[str] = None
) -> Optional[User]:
    """
    Completa el registro de un usuario a partir de una invitación.
    
    Args:
        db: Sesión de base de datos
        token: Token de la invitación
        first_name: Nombre del usuario
        last_name: Apellido del usuario
        password: Contraseña del usuario
        phone: Teléfono (opcional)
        
    Returns:
        Usuario creado si todo es correcto, None en caso contrario
    """
    # Obtener invitación
    invitation = get_invitation_by_token(db, token)
    
    # Verificar si es válida
    if not is_invitation_valid(invitation):
        return None
    
    # Crear usuario
    user = User(
        email=invitation.email,
        hashed_password=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        is_active=True,
        is_admin=False
    )
    
    db.add(user)
    db.flush()  # Para obtener el ID del usuario
    
    # Crear perfil según tipo de invitación
    if invitation.invitation_type == InvitationType.STAFF:
        staff = Staff(
            user_id=user.id,
            position=invitation.position,
            department=invitation.department,
            phone=phone,
            school_id=invitation.school_id
        )
        db.add(staff)
    
    elif invitation.invitation_type == InvitationType.GUARDIAN:
        guardian = Guardian(
            user_id=user.id,
            relationship_type=invitation.relationship_type,
            phone=phone,
            address="",  # Se puede completar después
        )
        db.add(guardian)
        # Si hay un estudiante asociado, relacionarlo
        if invitation.student_id:
            from app.models import Student
            student = db.query(Student).filter(Student.id == invitation.student_id).first()
            if student:
                guardian.students.append(student)
    
    # Marcar invitación como usada
    invitation.is_used = True
    
    db.commit()
    db.refresh(user)
    
    return user

def generate_invitation_url(base_url: str, token: str) -> str:
    """
    Genera la URL de invitación.
    
    Args:
        base_url: URL base
        token: Token de la invitación
        
    Returns:
        URL completa de la invitación
    """
    return f"{base_url}/register?token={token}"

def get_all_invitations(db: Session) -> List[Invitation]:
    """Retrieve all invitations from the database."""
    return db.query(Invitation).order_by(Invitation.created_at.desc()).all()

def delete_invitation_by_id(db: Session, invitation_id: int) -> bool:
    """Delete an invitation by its ID."""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if invitation:
        db.delete(invitation)
        db.commit()
        return True
    return False

def resend_invitation_by_id(db: Session, invitation_id: int) -> Optional[Invitation]:
    """Resends an invitation by refreshing its expiry date.
    
    Args:
        db: Database session.
        invitation_id: The ID of the invitation to resend.
        
    Returns:
        The updated invitation if found and not used, otherwise None.
    """
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    
    if invitation and not invitation.is_used:
        invitation.expires_at = datetime.utcnow() + timedelta(days=settings.INVITATION_EXPIRE_DAYS or 7)
        invitation.is_used = False # Ensure it's marked as not used
        # db.add(invitation) # Not strictly necessary if object is already in session and modified
        db.commit()
        db.refresh(invitation)
        # Here you would typically trigger an email sending process
        # For now, just updating the expiry serves the purpose of "resend"
        return invitation
    return None 