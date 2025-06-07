from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
from datetime import datetime
from typing import List, Optional

# Association tables for many-to-many relationships
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('assigned_at', DateTime(timezone=True), server_default=func.now()),
    Column('assigned_by_id', Integer, ForeignKey('users.id')),
    Column('expires_at', DateTime(timezone=True), nullable=True),
    Column('is_active', Boolean, default=True)
)

role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True),
    Column('granted_at', DateTime(timezone=True), server_default=func.now()),
    Column('granted_by_id', Integer, ForeignKey('users.id'))
)

class Permission(Base):
    """Granular permissions for ISO 27001 access control"""
    
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Permission identification
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)  # e.g., "student.read"
    description = Column(Text, nullable=False)
    
    # Categorization
    resource_type = Column(String(50), nullable=False, index=True)  # e.g., "student", "user", "system"
    action = Column(String(50), nullable=False, index=True)         # e.g., "read", "write", "delete"
    
    # Security classification
    is_sensitive = Column(Boolean, default=False, index=True)       # Requires additional authorization
    requires_approval = Column(Boolean, default=False)             # Requires approval workflow
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class Role(Base):
    """Roles for RBAC system"""
    
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Role identification
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    
    # Role properties
    is_system_role = Column(Boolean, default=False, index=True)     # System-defined vs custom roles
    is_privileged = Column(Boolean, default=False, index=True)      # High-privilege role requiring approval
    max_session_duration = Column(Integer, nullable=True)           # Maximum session duration in minutes
    
    # Access restrictions
    ip_restrictions = Column(Text, nullable=True)                   # JSON list of allowed IP ranges
    time_restrictions = Column(Text, nullable=True)                 # JSON object with time-based restrictions
    requires_mfa = Column(Boolean, default=False)                   # Requires multi-factor authentication
    
    # Approval workflow
    requires_approval = Column(Boolean, default=False)              # Role assignment requires approval
    auto_expires = Column(Boolean, default=False)                   # Role automatically expires
    default_expiry_days = Column(Integer, nullable=True)            # Default expiry period
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")
    approval_requests = relationship("RoleApprovalRequest", back_populates="role")

class RoleApprovalRequest(Base):
    """Role assignment approval requests for privileged access"""
    
    __tablename__ = "role_approval_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Request details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Request information
    justification = Column(Text, nullable=False)
    duration_days = Column(Integer, nullable=True)                  # Temporary access duration
    business_justification = Column(Text, nullable=True)
    
    # Approval workflow
    status = Column(String(50), nullable=False, default="pending", index=True)  # pending, approved, rejected, expired
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Expiry
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    role = relationship("Role", back_populates="approval_requests")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class AccessReview(Base):
    """Periodic access reviews for compliance"""
    
    __tablename__ = "access_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Review details
    review_name = Column(String(255), nullable=False)
    review_type = Column(String(50), nullable=False, index=True)    # 'periodic', 'role_based', 'user_based'
    scope_description = Column(Text, nullable=False)
    
    # Review period
    review_period_start = Column(DateTime(timezone=True), nullable=False)
    review_period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    status = Column(String(50), nullable=False, default="in_progress", index=True)
    progress_percentage = Column(Integer, default=0)
    
    # Ownership
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Results
    total_access_items = Column(Integer, default=0)
    reviewed_items = Column(Integer, default=0)
    approved_items = Column(Integer, default=0)
    revoked_items = Column(Integer, default=0)
    flagged_items = Column(Integer, default=0)
    
    # Completion
    completed_at = Column(DateTime(timezone=True), nullable=True)
    next_review_date = Column(DateTime(timezone=True), nullable=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    review_manager = relationship("User", foreign_keys=[review_manager_id])
    review_items = relationship("AccessReviewItem", back_populates="review")

class AccessReviewItem(Base):
    """Individual items in an access review"""
    
    __tablename__ = "access_review_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Review association
    review_id = Column(Integer, ForeignKey("access_reviews.id"), nullable=False)
    
    # Access details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=True)
    access_type = Column(String(50), nullable=False)               # 'role', 'permission', 'system_access'
    access_description = Column(Text, nullable=False)
    
    # Review decision
    review_status = Column(String(50), nullable=False, default="pending", index=True)
    review_decision = Column(String(50), nullable=True, index=True)  # 'approve', 'revoke', 'modify'
    reviewer_comments = Column(Text, nullable=True)
    
    # Risk assessment
    risk_level = Column(String(20), nullable=True, index=True)      # 'low', 'medium', 'high'
    last_used_date = Column(DateTime(timezone=True), nullable=True)
    usage_frequency = Column(String(50), nullable=True)            # 'daily', 'weekly', 'monthly', 'rarely'
    
    # Review timestamps
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    review = relationship("AccessReview", back_populates="review_items")
    user = relationship("User", foreign_keys=[user_id])
    role = relationship("Role")
    permission = relationship("Permission")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

class PrivilegedAccessSession(Base):
    """Tracking of privileged access sessions"""
    
    __tablename__ = "privileged_access_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Session details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(255), nullable=False, unique=True, index=True)
    
    # Access details
    privileged_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    access_justification = Column(Text, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Session lifecycle
    started_at = Column(DateTime(timezone=True), nullable=False)
    scheduled_end_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Session monitoring
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    activities_count = Column(Integer, default=0)
    
    # Security
    source_ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    mfa_verified = Column(Boolean, default=False)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    privileged_role = relationship("Role")
    approved_by = relationship("User", foreign_keys=[approved_by_id]) 