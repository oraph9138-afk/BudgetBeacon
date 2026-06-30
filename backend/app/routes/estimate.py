from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db, Estimate, User
from app.schemas import EstimateInput, EstimateResponse, EstimateBreakdown
from app.ml.predict import prediction_service
from app.ml.tips import generate_tips
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["estimates"])


@router.post("/estimate", response_model=EstimateResponse)
def create_estimate(
    data: EstimateInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = prediction_service.predict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    tips = generate_tips(data, result)

    estimate = Estimate(
        user_id=user.id,
        business_type=data.business_type,
        material_cost=data.material_cost,
        transport_cost=data.transport_cost,
        labor_cost=data.labor_cost,
        production_days=data.production_days,
        quantity=data.quantity,
        location=data.location,
        currency=data.currency,
        predicted_cost=result["predicted_cost"],
        confidence_pct=result["confidence_pct"],
        risk_level=result["risk_level"],
        created_at=datetime.utcnow(),
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)

    return EstimateResponse(
        predicted_cost=result["predicted_cost"],
        confidence_pct=result["confidence_pct"],
        risk_level=result["risk_level"],
        breakdown=EstimateBreakdown(**result["breakdown"]),
        timestamp=estimate.created_at,
        currency=data.currency,
        tips=tips,
    )
