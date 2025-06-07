from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.audit import AuditLog, SecurityEvent, AuditAction, RiskLevel
from app.models.user import User
import logging

# Setup logging
logger = logging.getLogger(__name__)

class AuditService:
    """Service for creating and managing audit logs"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_event(
        self,
        event_type: str,
        action: str,
        status: str = "success",
        user: Optional[User] = None,
        request: Optional[Request] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        is_suspicious: bool = False,
        risk_level: str = RiskLevel.LOW
    ) -> AuditLog:
        """Log an audit event"""
        
        # Extract user information
        user_id = user.id if user else None
        user_email = user.email if user else None
        user_type = self._get_user_type(user) if user else None
        
        # Extract request information
        ip_address = None
        user_agent = None
        endpoint = None
        http_method = None
        
        if request:
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent", "")[:500]  # Truncate long user agents
            endpoint = str(request.url.path)
            http_method = request.method
        
        # Create audit log entry
        audit_log = AuditLog.create_event(
            event_type=event_type,
            action=action,
            status=status,
            user_id=user_id,
            user_email=user_email,
            user_type=user_type,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            http_method=http_method,
            message=message,
            details=details,
            is_suspicious=is_suspicious,
            risk_level=risk_level
        )
        
        try:
            self.db.add(audit_log)
            self.db.commit()
            self.db.refresh(audit_log)
            
            # Log to application logger for immediate visibility
            log_level = logging.WARNING if is_suspicious else logging.INFO
            logger.log(
                log_level,
                f"Audit: {event_type} - {action} by {user_email or 'anonymous'} "
                f"from {ip_address} - {status}"
            )
            
            return audit_log
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            self.db.rollback()
            raise
    
    def log_authentication_event(
        self,
        event_type: str,
        status: str,
        user_email: str,
        request: Request,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log authentication-related events"""
        
        # Determine risk level based on event and status
        risk_level = RiskLevel.LOW
        is_suspicious = False
        
        if status == "failure":
            risk_level = RiskLevel.MEDIUM
            if event_type == SecurityEvent.LOGIN_FAILED:
                # Check for potential brute force
                recent_failures = self._count_recent_login_failures(user_email, request)
                if recent_failures >= 3:
                    risk_level = RiskLevel.HIGH
                    is_suspicious = True
                    message = f"Multiple login failures detected: {recent_failures} attempts"
        
        return self.log_event(
            event_type=event_type,
            action=AuditAction.LOGIN if "login" in event_type else AuditAction.ACCESS,
            status=status,
            request=request,
            resource_type="authentication",
            message=message or f"Authentication event: {event_type}",
            details={
                "user_email": user_email,
                **(details or {})
            },
            is_suspicious=is_suspicious,
            risk_level=risk_level
        )
    
    def log_data_access(
        self,
        resource_type: str,
        resource_id: str,
        action: str,
        user: User,
        request: Request,
        sensitive: bool = False,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log data access events"""
        
        event_type = SecurityEvent.SENSITIVE_DATA_ACCESS if sensitive else "data_access"
        risk_level = RiskLevel.MEDIUM if sensitive else RiskLevel.LOW
        
        return self.log_event(
            event_type=event_type,
            action=action,
            status="success",
            user=user,
            request=request,
            resource_type=resource_type,
            resource_id=resource_id,
            message=f"{'Sensitive ' if sensitive else ''}data {action}: {resource_type}#{resource_id}",
            details=details,
            risk_level=risk_level
        )
    
    def log_user_management(
        self,
        action: str,
        target_user_id: str,
        performed_by: User,
        request: Request,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log user management events"""
        
        # User management is always medium risk
        event_type = f"user_{action}"
        
        return self.log_event(
            event_type=event_type,
            action=action,
            status="success",
            user=performed_by,
            request=request,
            resource_type="user",
            resource_id=target_user_id,
            message=f"User {action} performed on user #{target_user_id}",
            details=details,
            risk_level=RiskLevel.MEDIUM
        )
    
    def log_student_access(
        self,
        student_id: str,
        access_type: str,  # "entry" or "exit"
        method: str,       # "qr_code", "manual", etc.
        performed_by: Optional[User] = None,
        request: Optional[Request] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log student access events"""
        
        event_type = SecurityEvent.STUDENT_ENTRY if access_type == "entry" else SecurityEvent.STUDENT_EXIT
        
        return self.log_event(
            event_type=event_type,
            action=AuditAction.ACCESS,
            status="success",
            user=performed_by,
            request=request,
            resource_type="student",
            resource_id=student_id,
            message=f"Student {access_type} via {method}",
            details={
                "access_method": method,
                "student_id": student_id,
                **(details or {})
            },
            risk_level=RiskLevel.LOW
        )
    
    def log_security_event(
        self,
        event_type: str,
        message: str,
        request: Request,
        user: Optional[User] = None,
        risk_level: str = RiskLevel.HIGH,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log security-related events"""
        
        return self.log_event(
            event_type=event_type,
            action="security_event",
            status="detected",
            user=user,
            request=request,
            message=message,
            details=details,
            is_suspicious=True,
            risk_level=risk_level
        )
    
    def log_bulk_operation(
        self,
        operation_type: str,
        affected_count: int,
        user: User,
        request: Request,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """Log bulk operations that affect multiple records"""
        
        return self.log_event(
            event_type=SecurityEvent.BULK_OPERATION,
            action=operation_type,
            status="success",
            user=user,
            request=request,
            message=f"Bulk {operation_type} affecting {affected_count} records",
            details={
                "affected_count": affected_count,
                "operation_type": operation_type,
                **(details or {})
            },
            risk_level=RiskLevel.MEDIUM
        )
    
    def _get_user_type(self, user: User) -> str:
        """Determine user type for audit logging"""
        if user.is_admin:
            return "admin"
        elif hasattr(user, 'staff_profile') and user.staff_profile:
            return "staff"
        elif hasattr(user, 'guardian_profile') and user.guardian_profile:
            return "parent"
        else:
            return "user"
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded IPs (from reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def _count_recent_login_failures(self, user_email: str, request: Request, minutes: int = 15) -> int:
        """Count recent login failures for a user from the same IP"""
        from datetime import datetime, timedelta
        
        ip_address = self._get_client_ip(request)
        since = datetime.now() - timedelta(minutes=minutes)
        
        try:
            count = self.db.query(AuditLog).filter(
                AuditLog.event_type == SecurityEvent.LOGIN_FAILED,
                AuditLog.user_email == user_email,
                AuditLog.ip_address == ip_address,
                AuditLog.created_at >= since
            ).count()
            
            return count
        except Exception as e:
            logger.error(f"Error counting login failures: {e}")
            return 0
    
    def get_security_events(
        self,
        hours: int = 24,
        risk_level: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> list[AuditLog]:
        """Get recent security events for monitoring"""
        from datetime import datetime, timedelta
        
        since = datetime.now() - timedelta(hours=hours)
        
        query = self.db.query(AuditLog).filter(
            AuditLog.created_at >= since
        )
        
        # Filter by risk level
        if risk_level:
            query = query.filter(AuditLog.risk_level == risk_level)
        else:
            # Default to medium and high risk events
            query = query.filter(AuditLog.risk_level.in_([RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]))
        
        # Filter by user
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        return query.order_by(AuditLog.created_at.desc()).limit(100).all()

def get_audit_service(db: Session) -> AuditService:
    """Factory function to create audit service"""
    return AuditService(db) 