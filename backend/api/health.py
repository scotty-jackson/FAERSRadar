"""Health check endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.db import get_db
from backend.models import CaseReport
from backend.schemas import HealthCheck

router = APIRouter()


@router.get("/health", response_model=HealthCheck)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Query database
        total_reports = db.query(func.count(CaseReport.id)).scalar() or 0

        # Get date range
        date_range = None
        if total_reports > 0:
            min_date = db.query(func.min(CaseReport.received_date)).scalar()
            max_date = db.query(func.max(CaseReport.received_date)).scalar()
            if min_date and max_date:
                date_range = f"{min_date.isoformat()} to {max_date.isoformat()}"

        return HealthCheck(
            status="healthy",
            database="connected",
            total_reports=total_reports,
            date_range=date_range
        )
    except Exception as e:
        return HealthCheck(
            status="unhealthy",
            database=f"error: {str(e)}",
            total_reports=0,
            date_range=None
        )
