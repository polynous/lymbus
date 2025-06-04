from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.auth import get_current_active_user
from app.schemas.user import User, UserCreate
from app.schemas.invitation import (
    InvitationCreate, 
    Invitation, 
    InvitationVerify, 
    InvitationResponse,
    CompleteRegistration
)
from app.services.invitation_service import (
    create_invitation,
    get_invitation_by_token,
    is_invitation_valid,
    complete_registration,
    generate_invitation_url,
    get_all_invitations,
    delete_invitation_by_id,
    resend_invitation_by_id
)

router = APIRouter()

@router.get("/", response_model=List[InvitationResponse])
async def get_invitations(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get list of invitations (for admin users).
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ver la lista de invitaciones"
        )
    
    db_invitations = get_all_invitations(db)
    
    base_url = str(request.base_url).rstrip('/')
    response_invitations = [
        InvitationResponse(
            id=inv.id,
            email=inv.email,
            invitation_type=inv.invitation_type.value,
            is_used=inv.is_used,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            invitation_url=generate_invitation_url(base_url, inv.token)
        )
        for inv in db_invitations
    ]
    return response_invitations

@router.post("/", response_model=InvitationResponse)
async def create_user_invitation(
    invitation: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crea una nueva invitación para un usuario.
    Solo disponible para usuarios autenticados y con permisos de administrador.
    """
    # Verificar que el usuario actual tiene permisos para crear invitaciones
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear invitaciones"
        )
    
    # Crear invitación
    db_invitation = create_invitation(db, invitation, current_user.id)
    
    # Generar URL de invitación
    base_url = str(request.base_url).rstrip('/')
    invitation_url = generate_invitation_url(base_url, db_invitation.token)
    
    # Convertir a formato de respuesta
    return InvitationResponse(
        id=db_invitation.id,
        email=db_invitation.email,
        invitation_type=db_invitation.invitation_type.value,
        is_used=db_invitation.is_used,
        expires_at=db_invitation.expires_at,
        created_at=db_invitation.created_at,
        invitation_url=invitation_url
    )

@router.post("/verify", response_model=dict)
async def verify_invitation(
    verification: InvitationVerify,
    db: Session = Depends(get_db)
):
    """
    Verifica si una invitación es válida.
    """
    invitation = get_invitation_by_token(db, verification.token)
    is_valid = is_invitation_valid(invitation)
    
    # Si la invitación es válida, devolver algunos datos
    if is_valid:
        return {
            "valid": True,
            "email": invitation.email,
            "invitation_type": invitation.invitation_type.value,
            "message": "Invitación válida"
        }
    
    return {
        "valid": False,
        "message": "Invitación inválida o expirada"
    }

@router.post("/register", response_model=User)
async def register_with_invitation(
    registration: CompleteRegistration,
    db: Session = Depends(get_db)
):
    """
    Completa el registro de un usuario con una invitación.
    """
    # Verificar la invitación
    invitation = get_invitation_by_token(db, registration.token)
    if not is_invitation_valid(invitation):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitación inválida o expirada"
        )
    
    # Completar registro
    user = complete_registration(
        db=db,
        token=registration.token,
        first_name=registration.first_name,
        last_name=registration.last_name,
        password=registration.password,
        phone=registration.phone
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al completar el registro"
        )
    
    return user 

@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation_route(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an invitation by ID (admin only).
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden eliminar invitaciones"
        )
    
    deleted = delete_invitation_by_id(db, invitation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitación no encontrada"
        )
    return # For 204 No Content 

@router.post("/{invitation_id}/resend", response_model=InvitationResponse)
async def resend_invitation_route(
    invitation_id: int,
    request: Request, # To build the full URL in response
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Resend an invitation by ID (admin only). This will refresh its expiry.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden reenviar invitaciones"
        )
    
    db_invitation = resend_invitation_by_id(db, invitation_id)
    if not db_invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitación no encontrada o ya utilizada"
        )
    
    base_url = str(request.base_url).rstrip('/')
    return InvitationResponse(
        id=db_invitation.id,
        email=db_invitation.email,
        invitation_type=db_invitation.invitation_type.value,
        is_used=db_invitation.is_used,
        expires_at=db_invitation.expires_at,
        created_at=db_invitation.created_at,
        invitation_url=generate_invitation_url(base_url, db_invitation.token)
    ) 