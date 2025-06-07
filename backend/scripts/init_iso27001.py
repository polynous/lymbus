#!/usr/bin/env python3
"""
Initialize ISO 27001:2022 compliance controls and data

This script sets up:
- All Annex A security controls
- Sample risk assessments
- Data inventory items
- Security training programs
- Compliance evidence collection
"""

import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.base import Base
from app.models.compliance import (
    SecurityControl, RiskAssessment, DataInventory, SecurityTraining,
    ComplianceEvidence, RiskLevel, ControlStatus, DataClassification
)
from app.models.user import User

def create_annex_a_controls(db):
    """Create all ISO 27001:2022 Annex A security controls"""
    
    controls = [
        # A.5 Organizational security
        {
            "control_id": "A.5.1",
            "title": "Policies for information security",
            "description": "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals or if significant changes occur.",
            "iso_reference": "ISO 27001:2022 A.5.1",
            "guidance": "Establish comprehensive information security policies covering all aspects of security management. Include policy review cycles and approval processes."
        },
        {
            "control_id": "A.5.2",
            "title": "Information security roles and responsibilities",
            "description": "Information security roles and responsibilities shall be defined and allocated according to the organization needs.",
            "iso_reference": "ISO 27001:2022 A.5.2",
            "guidance": "Define clear roles and responsibilities for information security throughout the organization, including CISO, security officers, and user responsibilities."
        },
        {
            "control_id": "A.5.3",
            "title": "Segregation of duties",
            "description": "Conflicting duties and conflicting areas of responsibility shall be segregated.",
            "iso_reference": "ISO 27001:2022 A.5.3",
            "guidance": "Implement proper segregation of duties to prevent unauthorized activities and reduce risk of fraud or error."
        },
        {
            "control_id": "A.5.4",
            "title": "Management responsibilities",
            "description": "Management shall require all personnel to apply information security in accordance with the established policies and procedures of the organization.",
            "iso_reference": "ISO 27001:2022 A.5.4",
            "guidance": "Establish management accountability for information security implementation and enforcement."
        },
        {
            "control_id": "A.5.5",
            "title": "Contact with authorities",
            "description": "Appropriate contacts with relevant authorities shall be maintained.",
            "iso_reference": "ISO 27001:2022 A.5.5",
            "guidance": "Maintain relationships with law enforcement, regulatory bodies, and other relevant authorities for incident response."
        },
        
        # A.6 People security
        {
            "control_id": "A.6.1",
            "title": "Screening",
            "description": "Background verification checks on all candidates for employment shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.",
            "iso_reference": "ISO 27001:2022 A.6.1",
            "guidance": "Implement appropriate screening procedures for all personnel with access to sensitive information, including background checks and reference verification."
        },
        {
            "control_id": "A.6.2",
            "title": "Terms and conditions of employment",
            "description": "The contractual agreements with personnel and contractors shall state their and the organization's responsibilities for information security.",
            "iso_reference": "ISO 27001:2022 A.6.2",
            "guidance": "Include information security responsibilities in employment contracts, confidentiality agreements, and contractor agreements."
        },
        {
            "control_id": "A.6.3",
            "title": "Information security awareness, education and training",
            "description": "Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates in organizational policies and procedures as relevant for their job function.",
            "iso_reference": "ISO 27001:2022 A.6.3",
            "guidance": "Provide regular security awareness training, role-specific training, and updates on security policies and procedures."
        },
        
        # A.7 Physical and environmental security
        {
            "control_id": "A.7.1",
            "title": "Physical security perimeters",
            "description": "Physical security perimeters shall be defined and used to protect areas that contain information and other associated assets.",
            "iso_reference": "ISO 27001:2022 A.7.1",
            "guidance": "Establish physical security perimeters with appropriate barriers, entry controls, and monitoring systems."
        },
        {
            "control_id": "A.7.2",
            "title": "Physical entry",
            "description": "Secure areas shall be protected by appropriate entry controls to ensure that only authorized personnel are allowed access.",
            "iso_reference": "ISO 27001:2022 A.7.2",
            "guidance": "Implement access controls for physical entry including card readers, biometrics, visitor management, and logging."
        },
        
        # A.8 Technology security
        {
            "control_id": "A.8.1",
            "title": "User endpoint devices",
            "description": "Information stored on, processed by or accessible via user endpoint devices shall be protected.",
            "iso_reference": "ISO 27001:2022 A.8.1",
            "guidance": "Implement endpoint protection including encryption, antivirus, device management, and secure configuration."
        },
        {
            "control_id": "A.8.2",
            "title": "Privileged access rights",
            "description": "The allocation and use of privileged access rights shall be restricted and managed.",
            "iso_reference": "ISO 27001:2022 A.8.2",
            "guidance": "Implement strict controls for privileged access including approval workflows, regular reviews, and monitoring."
        },
        {
            "control_id": "A.8.3",
            "title": "Information access restriction",
            "description": "Access to information and application system functions shall be restricted in accordance with the access control policy.",
            "iso_reference": "ISO 27001:2022 A.8.3",
            "guidance": "Implement role-based access controls with least privilege principle and regular access reviews."
        },
        {
            "control_id": "A.8.4",
            "title": "Access to source code",
            "description": "Read and write access to source code, development tools and software libraries shall be appropriately managed.",
            "iso_reference": "ISO 27001:2022 A.8.4",
            "guidance": "Control access to source code repositories with appropriate permissions, version control, and code review processes."
        },
        {
            "control_id": "A.8.5",
            "title": "Secure authentication",
            "description": "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the access control policy.",
            "iso_reference": "ISO 27001:2022 A.8.5",
            "guidance": "Implement strong authentication including multi-factor authentication for privileged access and sensitive systems."
        },
        
        # Additional key controls...
        {
            "control_id": "A.8.23",
            "title": "Web filtering",
            "description": "Access to external websites shall be managed to reduce exposure to malicious content.",
            "iso_reference": "ISO 27001:2022 A.8.23",
            "guidance": "Implement web filtering and monitoring to prevent access to malicious sites and inappropriate content."
        },
        {
            "control_id": "A.8.24",
            "title": "Use of cryptography",
            "description": "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.",
            "iso_reference": "ISO 27001:2022 A.8.24",
            "guidance": "Establish cryptography policies covering algorithm selection, key management, and implementation standards."
        }
    ]
    
    created_controls = []
    admin_user = db.query(User).filter(User.is_admin == True).first()
    if not admin_user:
        print("Warning: No admin user found. Using user ID 1 as default.")
        admin_user_id = 1
    else:
        admin_user_id = admin_user.id
    
    for control_data in controls:
        # Check if control already exists
        existing = db.query(SecurityControl).filter(
            SecurityControl.control_id == control_data["control_id"]
        ).first()
        
        if not existing:
            control = SecurityControl(
                control_id=control_data["control_id"],
                control_title=control_data["title"],
                control_description=control_data["description"],
                iso_reference=control_data["iso_reference"],
                implementation_guidance=control_data["guidance"],
                status=ControlStatus.NOT_IMPLEMENTED,
                control_owner_id=admin_user_id
            )
            db.add(control)
            created_controls.append(control)
            print(f"Created control: {control_data['control_id']} - {control_data['title']}")
        else:
            print(f"Control already exists: {control_data['control_id']}")
    
    db.commit()
    return created_controls

def create_sample_risk_assessments(db):
    """Create sample risk assessments for key assets"""
    
    admin_user = db.query(User).filter(User.is_admin == True).first()
    admin_user_id = admin_user.id if admin_user else 1
    
    risk_assessments = [
        {
            "asset_name": "Student Database",
            "asset_type": "data",
            "threat_description": "Unauthorized access to student personal information",
            "vulnerability_description": "Insufficient access controls and monitoring",
            "likelihood_score": 3,
            "impact_score": 4,
            "treatment_plan": "Implement enhanced access controls, encryption, and monitoring"
        },
        {
            "asset_name": "QR Code Access System",
            "asset_type": "system",
            "threat_description": "QR code spoofing or unauthorized entry",
            "vulnerability_description": "QR codes could be duplicated or intercepted",
            "likelihood_score": 2,
            "impact_score": 3,
            "treatment_plan": "Implement QR code encryption and time-based validity"
        },
        {
            "asset_name": "Web Application",
            "asset_type": "system",
            "threat_description": "Web application vulnerabilities leading to data breach",
            "vulnerability_description": "Potential SQL injection, XSS, or authentication bypass",
            "likelihood_score": 4,
            "impact_score": 5,
            "treatment_plan": "Regular security testing, code review, and vulnerability management"
        },
        {
            "asset_name": "Admin User Accounts",
            "asset_type": "people",
            "threat_description": "Compromise of administrative accounts",
            "vulnerability_description": "Weak passwords or lack of multi-factor authentication",
            "likelihood_score": 3,
            "impact_score": 5,
            "treatment_plan": "Enforce strong passwords, implement MFA, and privileged access management"
        }
    ]
    
    created_risks = []
    for risk_data in risk_assessments:
        risk_score = risk_data["likelihood_score"] * risk_data["impact_score"]
        
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
        
        risk = RiskAssessment(
            asset_name=risk_data["asset_name"],
            asset_type=risk_data["asset_type"],
            threat_description=risk_data["threat_description"],
            vulnerability_description=risk_data["vulnerability_description"],
            likelihood_score=risk_data["likelihood_score"],
            impact_score=risk_data["impact_score"],
            risk_score=risk_score,
            risk_level=risk_level,
            treatment_plan=risk_data["treatment_plan"],
            risk_owner_id=admin_user_id,
            status="identified",
            next_review_date=datetime.now() + timedelta(days=90)
        )
        
        db.add(risk)
        created_risks.append(risk)
        print(f"Created risk assessment: {risk_data['asset_name']} (Risk Level: {risk_level.value})")
    
    db.commit()
    return created_risks

def create_data_inventory(db):
    """Create initial data inventory"""
    
    admin_user = db.query(User).filter(User.is_admin == True).first()
    admin_user_id = admin_user.id if admin_user else 1
    
    data_items = [
        {
            "data_name": "Student Personal Information",
            "data_description": "Student names, addresses, phone numbers, email addresses, emergency contacts",
            "data_location": "PostgreSQL Database - students table",
            "classification": DataClassification.CONFIDENTIAL,
            "contains_pii": True,
            "contains_sensitive_data": True,
            "retention_period_months": 84,  # 7 years
            "processing_purpose": "Student enrollment, attendance tracking, emergency contact"
        },
        {
            "data_name": "User Authentication Data",
            "data_description": "Usernames, password hashes, login sessions, MFA tokens",
            "data_location": "PostgreSQL Database - users table",
            "classification": DataClassification.RESTRICTED,
            "contains_pii": False,
            "contains_sensitive_data": True,
            "retention_period_months": 36,  # 3 years
            "processing_purpose": "User authentication and access control"
        },
        {
            "data_name": "Audit Logs",
            "data_description": "System access logs, user activity, security events",
            "data_location": "PostgreSQL Database - audit_logs table",
            "classification": DataClassification.INTERNAL,
            "contains_pii": True,
            "contains_sensitive_data": False,
            "retention_period_months": 84,  # 7 years for compliance
            "processing_purpose": "Security monitoring, compliance, incident investigation"
        },
        {
            "data_name": "QR Code Access Records",
            "data_description": "QR code scans, entry/exit timestamps, location data",
            "data_location": "PostgreSQL Database - access_logs table",
            "classification": DataClassification.CONFIDENTIAL,
            "contains_pii": True,
            "contains_sensitive_data": False,
            "retention_period_months": 12,  # 1 year
            "processing_purpose": "Access control, attendance monitoring, safety tracking"
        }
    ]
    
    created_items = []
    for item_data in data_items:
        data_item = DataInventory(
            data_name=item_data["data_name"],
            data_description=item_data["data_description"],
            data_location=item_data["data_location"],
            classification=item_data["classification"],
            contains_pii=item_data["contains_pii"],
            contains_sensitive_data=item_data["contains_sensitive_data"],
            retention_period_months=item_data["retention_period_months"],
            processing_purpose=item_data["processing_purpose"],
            data_owner_id=admin_user_id,
            encryption_at_rest=True,  # PostgreSQL with encryption
            encryption_in_transit=True  # HTTPS/TLS
        )
        
        # Set deletion schedule
        data_item.deletion_schedule = datetime.now() + timedelta(days=item_data["retention_period_months"] * 30)
        
        db.add(data_item)
        created_items.append(data_item)
        print(f"Created data inventory item: {item_data['data_name']} ({item_data['classification'].value})")
    
    db.commit()
    return created_items

def create_security_training_programs(db):
    """Create mandatory security training programs"""
    
    admin_user = db.query(User).filter(User.is_admin == True).first()
    all_users = db.query(User).all()
    
    training_programs = [
        {
            "training_name": "Information Security Awareness",
            "training_description": "Basic information security awareness covering password security, phishing recognition, and incident reporting",
            "training_type": "mandatory",
            "days_to_complete": 30
        },
        {
            "training_name": "GDPR and Data Protection",
            "training_description": "Data protection principles, GDPR compliance, and privacy by design",
            "training_type": "mandatory",
            "days_to_complete": 45
        },
        {
            "training_name": "Incident Response Procedures",
            "training_description": "How to recognize, report, and respond to security incidents",
            "training_type": "role_specific",
            "days_to_complete": 30
        }
    ]
    
    created_training = []
    for program in training_programs:
        for user in all_users:
            # Skip role-specific training for non-admin users for now
            if program["training_type"] == "role_specific" and not user.is_admin:
                continue
                
            training = SecurityTraining(
                user_id=user.id,
                training_name=program["training_name"],
                training_description=program["training_description"],
                training_type=program["training_type"],
                assigned_date=datetime.now(),
                due_date=datetime.now() + timedelta(days=program["days_to_complete"])
            )
            
            db.add(training)
            created_training.append(training)
    
    db.commit()
    print(f"Created {len(created_training)} security training assignments")
    return created_training

def main():
    """Initialize ISO 27001:2022 compliance structure"""
    
    print("🔒 Initializing ISO 27001:2022 Compliance Structure")
    print("=" * 60)
    
    # Create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Initialize security controls
        print("\n📋 Creating ISO 27001:2022 Annex A Security Controls...")
        controls = create_annex_a_controls(db)
        print(f"✅ Created {len(controls)} security controls")
        
        # Create sample risk assessments
        print("\n⚠️ Creating Sample Risk Assessments...")
        risks = create_sample_risk_assessments(db)
        print(f"✅ Created {len(risks)} risk assessments")
        
        # Create data inventory
        print("\n📊 Creating Data Inventory...")
        data_items = create_data_inventory(db)
        print(f"✅ Created {len(data_items)} data inventory items")
        
        # Create security training programs
        print("\n🎓 Creating Security Training Programs...")
        training = create_security_training_programs(db)
        print(f"✅ Created security training assignments")
        
        print("\n" + "=" * 60)
        print("🎉 ISO 27001:2022 Compliance Structure Initialized Successfully!")
        print("\nNext Steps:")
        print("1. Review and update security controls implementation status")
        print("2. Conduct detailed risk assessments for all critical assets") 
        print("3. Complete data inventory for all processing activities")
        print("4. Ensure all personnel complete mandatory security training")
        print("5. Establish regular compliance monitoring and reviews")
        
    except Exception as e:
        print(f"❌ Error during initialization: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 