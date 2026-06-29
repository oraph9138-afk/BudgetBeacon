from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db, Estimate, User
from app.schemas import HistoryItem
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def get_history(limit: int = Query(default=50, le=200), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    estimates = (
        db.query(Estimate)
        .filter(Estimate.user_id == user.id)
        .order_by(desc(Estimate.created_at))
        .limit(limit)
        .all()
    )

    return [
        HistoryItem(
            id=e.id,
            business_type=e.business_type,
            predicted_cost=e.predicted_cost,
            confidence_pct=e.confidence_pct,
            risk_level=e.risk_level,
            created_at=e.created_at.isoformat() if e.created_at else "",
        )
        for e in estimates
    ]
