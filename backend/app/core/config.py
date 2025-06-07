from pydantic_settings import BaseSettings
from typing import Optional, List
import secrets
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Lymbus")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours default
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lymbus.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3004,http://127.0.0.1:3000,http://127.0.0.1:3004"
    ).split(",")
    
    # Email Configuration (for future use)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@lymbus.com")
    
    # Default Admin User (for initial setup only)
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@lymbus.com")
    DEFAULT_ADMIN_PASSWORD: Optional[str] = os.getenv("DEFAULT_ADMIN_PASSWORD")
    DEFAULT_ADMIN_FIRST_NAME: str = os.getenv("DEFAULT_ADMIN_FIRST_NAME", "Admin")
    DEFAULT_ADMIN_LAST_NAME: str = os.getenv("DEFAULT_ADMIN_LAST_NAME", "Lymbus")
    
    class Config:
        case_sensitive = True

settings = Settings() 