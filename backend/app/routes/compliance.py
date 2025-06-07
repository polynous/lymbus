from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.compliance import (
    RiskAssessment, SecurityControl, SecurityIncident, DataInventory,
    ComplianceEvidence, SecurityTraining, RiskLevel, ControlStatus,
    IncidentSeverity, IncidentStatus, DataClassification
)
from app.services.auth import get_current_user
from app.services.audit_service import get_audit_service
from app.services.iso27001_service import get_iso27001_service
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for request/response
class RiskAssessmentCreate(BaseModel):
    asset_name: str
    asset_type: str
    threat_description: str
    vulnerability_description: str
    likelihood_score: int  # 1-5
    impact_score: int      # 1-5
    treatment_plan: Optional[str] = None

class SecurityIncidentCreate(BaseModel):
    title: str
    description: str
    severity: str  # "low", "medium", "high", "critical"
    category: str
    affected_assets: Optional[List[str]] = None

class DataInventoryCreate(BaseModel):
    data_name: str
    data_description: str
    data_location: str
    classification: str  # "public", "internal", "confidential", "restricted"
    processing_purpose: str
    contains_pii: bool = False
    contains_sensitive_data: bool = False
    retention_period_months: Optional[int] = None

class ComplianceEvidenceCreate(BaseModel):
    evidence_type: str
    title: str
    description: str
    iso_control_reference: str
    evidence_data: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None

class SecurityTrainingCreate(BaseModel):
    user_id: int
    training_name: str
    training_description: str
    training_type: str
    due_date: datetime

@router.get("/dashboard")
async def get_compliance_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ISO 27001:2022 compliance dashboard"""
    
    # Check if user has access to compliance data
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    iso_service = get_iso27001_service(db)
    dashboard_data = iso_service.get_compliance_dashboard()
    
    # Add real-time security metrics
    from app.models.audit import AuditLog
    
    # Recent security events (last 24 hours)
    recent_events = db.query(AuditLog).filter(
        AuditLog.created_at >= datetime.now() - timedelta(hours=24),
        AuditLog.is_suspicious == True
    ).count()
    
    dashboard_data["security_metrics"] = {
        "recent_suspicious_events": recent_events,
        "last_updated": datetime.now().isoformat()
    }
    
    return dashboard_data

@router.get("/risks")
async def get_risk_assessments(
    skip: int = 0,
    limit: int = 50,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get risk assessments with optional filtering"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    query = db.query(RiskAssessment)
    
    if risk_level:
        query = query.filter(RiskAssessment.risk_level == risk_level)
    
    risks = query.offset(skip).limit(limit).all()
    
    return {
        "risks": risks,
        "total": query.count(),
        "filters": {"risk_level": risk_level}
    }

@router.post("/risks")
async def create_risk_assessment(
    risk_data: RiskAssessmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new risk assessment"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Calculate risk score
    risk_score = risk_data.likelihood_score * risk_data.impact_score
    
    # Determine risk level
    if risk_score <= 4:
        risk_level = RiskLevel.LOW
    elif risk_score <= 9:
        risk_level = RiskLevel.MEDIUM
    elif risk_score <= 16:
        risk_level = RiskLevel.HIGH
    elif risk_score <= 20:
        risk_level = RiskLevel.VERY_HIGH
    else:
        risk_level = RiskLevel.CRITICAL
    
    # Create risk assessment
    risk = RiskAssessment(
        asset_name=risk_data.asset_name,
        asset_type=risk_data.asset_type,
        threat_description=risk_data.threat_description,
        vulnerability_description=risk_data.vulnerability_description,
        likelihood_score=risk_data.likelihood_score,
        impact_score=risk_data.impact_score,
        risk_score=risk_score,
        risk_level=risk_level,
        treatment_plan=risk_data.treatment_plan,
        risk_owner_id=current_user.id,
        status="identified",
        next_review_date=datetime.now() + timedelta(days=90)
    )
    
    db.add(risk)
    db.commit()
    db.refresh(risk)
    
    # Log audit event
    audit_service = get_audit_service(db)
    audit_service.log_event(
        event_type="risk_assessment_created",
        action="create",
        user=current_user,
        request=request,
        resource_type="risk_assessment",
        resource_id=str(risk.id),
        message=f"Risk assessment created for asset: {risk_data.asset_name}",
        details={
            "asset_name": risk_data.asset_name,
            "risk_level": risk_level.value,
            "risk_score": risk_score
        }
    )
    
    return risk

@router.get("/incidents")
async def get_security_incidents(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security incidents with filtering"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    query = db.query(SecurityIncident)
    
    if status_filter:
        query = query.filter(SecurityIncident.status == status_filter)
    
    if severity:
        query = query.filter(SecurityIncident.severity == severity)
    
    incidents = query.order_by(SecurityIncident.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "incidents": incidents,
        "total": query.count(),
        "filters": {"status": status_filter, "severity": severity}
    }

@router.post("/incidents")
async def create_security_incident(
    incident_data: SecurityIncidentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Report a new security incident"""
    
    # Any authenticated user can report incidents
    now = datetime.now()
    
    # Generate incident ID
    incident_count = db.query(SecurityIncident).count() + 1
    incident_id = f"INC-{now.year}-{incident_count:04d}"
    
    # Map severity string to enum
    severity_map = {
        "low": IncidentSeverity.LOW,
        "medium": IncidentSeverity.MEDIUM,
        "high": IncidentSeverity.HIGH,
        "critical": IncidentSeverity.CRITICAL
    }
    
    severity_enum = severity_map.get(incident_data.severity.lower(), IncidentSeverity.MEDIUM)
    
    incident = SecurityIncident(
        incident_id=incident_id,
        title=incident_data.title,
        description=incident_data.description,
        severity=severity_enum,
        category=incident_data.category,
        affected_assets=str(incident_data.affected_assets) if incident_data.affected_assets else None,
        detected_at=now,
        reported_at=now,
        status=IncidentStatus.OPEN,
        reported_by_id=current_user.id
    )
    
    # Determine if regulatory notification is required
    if severity_enum in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
        incident.regulatory_notification_required = True
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # Log audit event
    audit_service = get_audit_service(db)
    audit_service.log_event(
        event_type="security_incident_reported",
        action="create",
        user=current_user,
        request=request,
        resource_type="security_incident",
        resource_id=incident_id,
        message=f"Security incident reported: {incident_data.title}",
        details={
            "severity": incident_data.severity,
            "category": incident_data.category,
            "regulatory_notification_required": incident.regulatory_notification_required
        },
        is_suspicious=True if severity_enum in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL] else False,
        risk_level="high" if severity_enum in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL] else "medium"
    )
    
    return incident

@router.get("/controls")
async def get_security_controls(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security controls status"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    query = db.query(SecurityControl)
    
    if status_filter:
        query = query.filter(SecurityControl.status == status_filter)
    
    controls = query.offset(skip).limit(limit).all()
    
    return {
        "controls": controls,
        "total": query.count(),
        "filters": {"status": status_filter}
    }

@router.get("/data-inventory")
async def get_data_inventory(
    skip: int = 0,
    limit: int = 50,
    classification: Optional[str] = None,
    contains_pii: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get data inventory with filtering"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    query = db.query(DataInventory)
    
    if classification:
        query = query.filter(DataInventory.classification == classification)
    
    if contains_pii is not None:
        query = query.filter(DataInventory.contains_pii == contains_pii)
    
    data_items = query.offset(skip).limit(limit).all()
    
    return {
        "data_items": data_items,
        "total": query.count(),
        "filters": {"classification": classification, "contains_pii": contains_pii}
    }

@router.post("/data-inventory")
async def create_data_inventory_item(
    data_item: DataInventoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add item to data inventory"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Map classification string to enum
    classification_map = {
        "public": DataClassification.PUBLIC,
        "internal": DataClassification.INTERNAL,
        "confidential": DataClassification.CONFIDENTIAL,
        "restricted": DataClassification.RESTRICTED
    }
    
    classification_enum = classification_map.get(data_item.classification.lower())
    if not classification_enum:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid classification. Must be: public, internal, confidential, or restricted"
        )
    
    inventory_item = DataInventory(
        data_name=data_item.data_name,
        data_description=data_item.data_description,
        data_location=data_item.data_location,
        classification=classification_enum,
        contains_pii=data_item.contains_pii,
        contains_sensitive_data=data_item.contains_sensitive_data,
        retention_period_months=data_item.retention_period_months,
        processing_purpose=data_item.processing_purpose,
        data_owner_id=current_user.id
    )
    
    # Set deletion schedule if retention period is specified
    if data_item.retention_period_months:
        inventory_item.deletion_schedule = datetime.now() + timedelta(days=data_item.retention_period_months * 30)
    
    db.add(inventory_item)
    db.commit()
    db.refresh(inventory_item)
    
    # Log audit event
    audit_service = get_audit_service(db)
    audit_service.log_event(
        event_type="data_inventory_created",
        action="create",
        user=current_user,
        request=request,
        resource_type="data_inventory",
        resource_id=str(inventory_item.id),
        message=f"Data inventory item created: {data_item.data_name}",
        details={
            "classification": data_item.classification,
            "contains_pii": data_item.contains_pii,
            "contains_sensitive": data_item.contains_sensitive_data
        },
        is_suspicious=data_item.classification in ["confidential", "restricted"]
    )
    
    return inventory_item

@router.get("/training")
async def get_security_training(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security training records"""
    
    query = db.query(SecurityTraining)
    
    # Non-admin users can only see their own training
    if not current_user.is_admin:
        query = query.filter(SecurityTraining.user_id == current_user.id)
    elif user_id:
        query = query.filter(SecurityTraining.user_id == user_id)
    
    if completed is not None:
        if completed:
            query = query.filter(SecurityTraining.completed_date.isnot(None))
        else:
            query = query.filter(SecurityTraining.completed_date.is_(None))
    
    training_records = query.offset(skip).limit(limit).all()
    
    return {
        "training_records": training_records,
        "total": query.count(),
        "filters": {"user_id": user_id, "completed": completed}
    }

@router.post("/training")
async def assign_security_training(
    training_data: SecurityTrainingCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign security training to a user"""
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    training = SecurityTraining(
        user_id=training_data.user_id,
        training_name=training_data.training_name,
        training_description=training_data.training_description,
        training_type=training_data.training_type,
        assigned_date=datetime.now(),
        due_date=training_data.due_date
    )
    
    db.add(training)
    db.commit()
    db.refresh(training)
    
    # Log audit event
    audit_service = get_audit_service(db)
    audit_service.log_event(
        event_type="security_training_assigned",
        action="create",
        user=current_user,
        request=request,
        resource_type="security_training",
        resource_id=str(training.id),
        message=f"Security training assigned: {training_data.training_name}",
        details={
            "training_type": training_data.training_type,
            "assigned_to_user_id": training_data.user_id,
            "due_date": training_data.due_date.isoformat()
        }
    )
    
    return training 