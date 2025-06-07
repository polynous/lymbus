from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import json
from datetime import datetime
from typing import Optional, Dict, Any
import enum

class RiskLevel(enum.Enum):
    """Risk level enumeration for ISO 27001 compliance"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"

class ControlStatus(enum.Enum):
    """Security control implementation status"""
    NOT_IMPLEMENTED = "not_implemented"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    EFFECTIVE = "effective"
    NEEDS_IMPROVEMENT = "needs_improvement"

class IncidentSeverity(enum.Enum):
    """Security incident severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(enum.Enum):
    """Security incident status"""
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"

class DataClassification(enum.Enum):
    """Data classification levels per ISO 27001"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class RiskAssessment(Base):
    """Risk assessment model for ISO 27001 compliance"""
    
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Risk identification
    asset_name = Column(String(255), nullable=False, index=True)
    asset_type = Column(String(100), nullable=False)  # 'system', 'data', 'process', 'people'
    threat_description = Column(Text, nullable=False)
    vulnerability_description = Column(Text, nullable=False)
    
    # Risk analysis
    likelihood_score = Column(Integer, nullable=False)  # 1-5 scale
    impact_score = Column(Integer, nullable=False)      # 1-5 scale
    risk_score = Column(Float, nullable=False)          # likelihood * impact
    risk_level = Column(SQLEnum(RiskLevel), nullable=False, index=True)
    
    # Risk treatment
    treatment_plan = Column(Text, nullable=True)
    residual_risk_score = Column(Float, nullable=True)
    residual_risk_level = Column(SQLEnum(RiskLevel), nullable=True)
    
    # Ownership and responsibility
    risk_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status and dates
    status = Column(String(50), nullable=False, default="identified")
    review_date = Column(DateTime(timezone=True), nullable=True)
    next_review_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    risk_owner = relationship("User", foreign_keys=[risk_owner_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    controls = relationship("SecurityControl", back_populates="risk_assessment")

class SecurityControl(Base):
    """Security controls model based on ISO 27001 Annex A"""
    
    __tablename__ = "security_controls"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Control identification
    control_id = Column(String(20), nullable=False, unique=True, index=True)  # e.g., "A.5.1"
    control_title = Column(String(255), nullable=False)
    control_description = Column(Text, nullable=False)
    iso_reference = Column(String(50), nullable=False)  # ISO 27001:2022 reference
    
    # Implementation details
    implementation_guidance = Column(Text, nullable=True)
    implementation_evidence = Column(Text, nullable=True)
    
    # Status and effectiveness
    status = Column(SQLEnum(ControlStatus), nullable=False, default=ControlStatus.NOT_IMPLEMENTED)
    effectiveness_rating = Column(Integer, nullable=True)  # 1-5 scale
    last_assessment_date = Column(DateTime(timezone=True), nullable=True)
    next_assessment_date = Column(DateTime(timezone=True), nullable=True)
    
    # Ownership
    control_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    control_owner = relationship("User")
    risk_assessment = relationship("RiskAssessment", back_populates="controls")
    incidents = relationship("SecurityIncident", secondary="incident_controls")

class SecurityIncident(Base):
    """Security incidents model for ISO 27001 incident management"""
    
    __tablename__ = "security_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Incident identification
    incident_id = Column(String(50), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Classification
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # 'data_breach', 'unauthorized_access', etc.
    affected_assets = Column(Text, nullable=True)  # JSON list of affected assets
    
    # Timeline
    detected_at = Column(DateTime(timezone=True), nullable=False)
    reported_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Response
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.OPEN, index=True)
    response_actions = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    
    # Impact assessment
    confidentiality_impact = Column(Boolean, default=False)
    integrity_impact = Column(Boolean, default=False)
    availability_impact = Column(Boolean, default=False)
    estimated_cost = Column(Float, nullable=True)
    
    # Ownership
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Compliance
    regulatory_notification_required = Column(Boolean, default=False)
    regulatory_notification_sent = Column(Boolean, default=False)
    notification_authorities = Column(Text, nullable=True)  # JSON list
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    reported_by = relationship("User", foreign_keys=[reported_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])

# Association table for incident-control relationships
incident_controls = Column(
    'incident_controls',
    Base.metadata,
    Column('incident_id', Integer, ForeignKey('security_incidents.id'), primary_key=True),
    Column('control_id', Integer, ForeignKey('security_controls.id'), primary_key=True)
)

class DataInventory(Base):
    """Data inventory for data protection compliance"""
    
    __tablename__ = "data_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Data identification
    data_name = Column(String(255), nullable=False)
    data_description = Column(Text, nullable=False)
    data_location = Column(String(255), nullable=False)  # System/database where data is stored
    
    # Classification
    classification = Column(SQLEnum(DataClassification), nullable=False, index=True)
    contains_pii = Column(Boolean, default=False, index=True)
    contains_sensitive_data = Column(Boolean, default=False, index=True)
    
    # Data lifecycle
    retention_period_months = Column(Integer, nullable=True)
    deletion_schedule = Column(DateTime(timezone=True), nullable=True)
    
    # Processing details
    processing_purpose = Column(Text, nullable=False)
    legal_basis = Column(String(255), nullable=True)  # GDPR legal basis
    data_subjects = Column(String(255), nullable=True)  # Who the data is about
    
    # Security measures
    encryption_at_rest = Column(Boolean, default=False)
    encryption_in_transit = Column(Boolean, default=False)
    access_controls = Column(Text, nullable=True)  # Description of access controls
    
    # Ownership
    data_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_controller_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    data_owner = relationship("User", foreign_keys=[data_owner_id])
    data_controller = relationship("User", foreign_keys=[data_controller_id])

class ComplianceEvidence(Base):
    """Evidence collection for compliance audits"""
    
    __tablename__ = "compliance_evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Evidence identification
    evidence_type = Column(String(100), nullable=False, index=True)  # 'policy', 'procedure', 'log', 'certificate'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Associated requirements
    iso_control_reference = Column(String(50), nullable=True, index=True)
    compliance_requirement = Column(String(255), nullable=True)
    
    # Evidence details
    file_path = Column(String(500), nullable=True)  # Path to evidence file
    evidence_data = Column(Text, nullable=True)      # JSON data or text evidence
    collection_method = Column(String(100), nullable=False)  # 'automated', 'manual', 'system_generated'
    
    # Validation
    is_validated = Column(Boolean, default=False, index=True)
    validated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    validation_date = Column(DateTime(timezone=True), nullable=True)
    
    # Retention
    retention_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    collected_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    collected_by = relationship("User", foreign_keys=[collected_by_id])
    validated_by = relationship("User", foreign_keys=[validated_by_id])

class SecurityTraining(Base):
    """Security awareness training tracking"""
    
    __tablename__ = "security_training"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Training details
    training_name = Column(String(255), nullable=False)
    training_description = Column(Text, nullable=False)
    training_type = Column(String(100), nullable=False)  # 'mandatory', 'role_specific', 'awareness'
    
    # Participant
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Completion tracking
    assigned_date = Column(DateTime(timezone=True), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)  # Training score if applicable
    passed = Column(Boolean, nullable=True)
    
    # Certification
    certificate_issued = Column(Boolean, default=False)
    certificate_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User") 