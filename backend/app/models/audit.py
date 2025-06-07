from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import json
from datetime import datetime
from typing import Optional, Dict, Any

class AuditLog(Base):
    """Audit log model for tracking security-sensitive operations"""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Event information
    event_type = Column(String(100), nullable=False, index=True)  # e.g., 'login', 'logout', 'data_access'
    action = Column(String(100), nullable=False, index=True)      # e.g., 'create', 'read', 'update', 'delete'
    resource_type = Column(String(100), index=True)              # e.g., 'user', 'student', 'access_log'
    resource_id = Column(String(100), index=True)                # ID of the affected resource
    
    # User information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    user_type = Column(String(50), nullable=True)                # 'admin', 'staff', 'parent'
    
    # Request information
    ip_address = Column(String(45), nullable=True, index=True)   # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    endpoint = Column(String(255), nullable=True, index=True)
    http_method = Column(String(10), nullable=True)
    
    # Event details
    status = Column(String(20), nullable=False, index=True)      # 'success', 'failure', 'error'
    message = Column(Text, nullable=True)                        # Human-readable description
    details = Column(Text, nullable=True)                        # JSON details about the event
    
    # Security flags
    is_suspicious = Column(Boolean, default=False, index=True)   # Flag for potentially suspicious activity
    risk_level = Column(String(20), default='low', index=True)   # 'low', 'medium', 'high', 'critical'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, event={self.event_type}, user={self.user_email}, status={self.status})>"
    
    @classmethod
    def create_event(
        cls,
        event_type: str,
        action: str,
        status: str,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        user_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        is_suspicious: bool = False,
        risk_level: str = 'low'
    ) -> "AuditLog":
        """Create a new audit log entry"""
        
        # Convert details to JSON string if provided
        details_json = None
        if details:
            try:
                details_json = json.dumps(details, default=str)
            except Exception:
                details_json = str(details)
        
        return cls(
            event_type=event_type,
            action=action,
            status=status,
            user_id=user_id,
            user_email=user_email,
            user_type=user_type,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            message=message,
            details=details_json,
            is_suspicious=is_suspicious,
            risk_level=risk_level
        )
    
    def get_details_dict(self) -> Optional[Dict[str, Any]]:
        """Parse details JSON back to dictionary"""
        if not self.details:
            return None
        try:
            return json.loads(self.details)
        except json.JSONDecodeError:
            return {"raw_details": self.details}
    
    def is_security_event(self) -> bool:
        """Check if this is a security-related event"""
        security_events = [
            'login', 'logout', 'login_failed', 'password_change',
            'user_created', 'user_deactivated', 'permission_changed',
            'access_denied', 'suspicious_activity', 'rate_limit_exceeded'
        ]
        return self.event_type in security_events or self.is_suspicious
    
    def is_high_risk(self) -> bool:
        """Check if this is a high risk event"""
        return self.risk_level in ['high', 'critical'] or self.is_suspicious

class SecurityEvent:
    """Helper class for common security event types"""
    
    # Authentication events
    LOGIN_SUCCESS = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    
    # User management events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DEACTIVATED = "user_deactivated"
    USER_DELETED = "user_deleted"
    PERMISSION_CHANGED = "permission_changed"
    
    # Access control events
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    
    # Data events
    SENSITIVE_DATA_ACCESS = "sensitive_data_access"
    DATA_EXPORT = "data_export"
    BULK_OPERATION = "bulk_operation"
    
    # Security events
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
    SECURITY_VIOLATION = "security_violation"
    
    # Student tracking events
    STUDENT_ENTRY = "student_entry"
    STUDENT_EXIT = "student_exit"
    QR_CODE_SCANNED = "qr_code_scanned"
    ACCESS_LOG_CREATED = "access_log_created"

class AuditAction:
    """Standard action types for audit logging"""
    
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    ACCESS = "access"
    SCAN = "scan"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"
    SEND = "send"
    RECEIVE = "receive"

class RiskLevel:
    """Risk level constants"""
    
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical" 