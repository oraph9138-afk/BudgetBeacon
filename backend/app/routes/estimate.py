from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db, Estimate
from app.schemas import EstimateInput, EstimateResponse, EstimateBreakdown
from app.ml.predict import prediction_service

router = APIRouter(prefix="/api", tags=["estimates"])


@router.post("/estimate", response_model=EstimateResponse)
def create_estimate(data: EstimateInput, db: Session = Depends(get_db)):
    try:
        result = prediction_service.predict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    estimate = Estimate(
        business_type=data.business_type,
        material_cost=data.material_cost,
        transport_cost=data.transport_cost,
        labor_cost=data.labor_cost,
        production_days=data.production_days,
        quantity=data.quantity,
        location=data.location,
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
    )
