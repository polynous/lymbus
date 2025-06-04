from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.services.auth import (
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from app.schemas.user import Token, User as UserSchema

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    user_type = "admin" if current_user.is_admin else None
    school_id_to_return = None
    
    if hasattr(current_user, 'staff_profile') and current_user.staff_profile:
        user_type = "staff"
        if hasattr(current_user.staff_profile, 'school_id') and current_user.staff_profile.school_id:
            school_id_to_return = current_user.staff_profile.school_id
    elif hasattr(current_user, 'guardian_profile') and current_user.guardian_profile:
        user_type = "parent"
    
    # If user is admin and doesn't have a staff_profile with school_id directly,
    # they might be a super-admin not tied to one school, or school_id needs to be sourced differently for them.
    # For now, we only get school_id if they have a staff_profile with it.
    if current_user.is_admin and current_user.staff_profile and hasattr(current_user.staff_profile, 'school_id'):
        school_id_to_return = current_user.staff_profile.school_id
        user_type = "admin" # Ensure admin type is set if they have a staff profile
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_active": current_user.is_active,
        "is_admin": current_user.is_admin,
        "user_type": user_type,
        "school_id": school_id_to_return, # Include school_id
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at if hasattr(current_user, "updated_at") else None,
    }

@router.get("/debug")
async def debug_endpoint():
    """Simple endpoint for debugging"""
    return {"status": "ok", "message": "Debug endpoint working correctly"} 