from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.services.auth import get_current_active_user
from app.schemas.user import User

router = APIRouter()

@router.get("/parent-arrivals")
async def get_parent_arrivals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of parent arrivals."""
    # TODO: Implement actual parent arrivals logic
    mock_data = [
        {
            "id": 1,
            "parent_name": "Maria González",
            "parent_phone": "+34 666 123 456",
            "student_ids": [1001],
            "student_names": ["Ana González Rivera"],
            "arrival_time": datetime.now().isoformat(),
            "status": "waiting",
            "arrival_method": "driving",
            "location": "main_entrance"
        }
    ]
    return mock_data

@router.get("/queue")
async def get_pickup_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the current pickup queue."""
    # TODO: Implement actual pickup queue logic
    mock_data = [
        {
            "id": 1,
            "student_id": 6002,
            "student_name": "Ana Gonzalez Rivera",
            "parent_id": 1,
            "parent_name": "Maria Gonzalez",
            "classroom": "5º A",
            "requested_at": datetime.now().isoformat(),
            "status": "ready"
        }
    ]
    return mock_data

@router.get("/completed")
async def get_completed_pickups(
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get completed pickups for a specific date."""
    # TODO: Implement actual completed pickups logic
    mock_data = [
        {
            "id": 1,
            "student_name": "Pablo Martinez",
            "parent_name": "Rosa Martinez",
            "completed_at": datetime.now().isoformat(),
            "pickup_time": "14:30"
        }
    ]
    return mock_data

@router.post("/parent-arrived")
async def register_parent_arrival(
    arrival_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register a parent arrival."""
    # TODO: Implement actual parent arrival registration logic
    arrival = {
        "id": 1,
        "parent_name": arrival_data.get("parent_name"),
        "parent_phone": arrival_data.get("parent_phone"),
        "student_ids": arrival_data.get("student_ids", []),
        "student_names": arrival_data.get("student_names", []),
        "arrival_time": datetime.now().isoformat(),
        "status": "waiting",
        "arrival_method": arrival_data.get("arrival_method", "walking"),
        "location": arrival_data.get("location", "main_entrance")
    }
    return {"success": True, "arrival": arrival}

@router.post("/request-student")
async def request_student_from_classroom(
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Request a student to be brought from their classroom."""
    # TODO: Implement actual student request logic
    return {"success": True, "message": "Student request sent to teacher"}

@router.post("/complete")
async def complete_pickup(
    completion_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a pickup as completed."""
    # TODO: Implement actual pickup completion logic
    return {"success": True, "message": "Pickup completed successfully"} 