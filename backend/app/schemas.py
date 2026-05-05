from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EstimateInput(BaseModel):
    business_type: str
    material_cost: float
    transport_cost: float
    labor_cost: float
    production_days: int
    quantity: int
    location: str


class EstimateBreakdown(BaseModel):
    material: float
    transport: float
    labor: float
    overhead_estimated: float


class EstimateResponse(BaseModel):
    predicted_cost: float
    confidence_pct: float
    risk_level: str
    breakdown: EstimateBreakdown
    timestamp: datetime


class HistoryItem(BaseModel):
    id: int
    business_type: str
    predicted_cost: float
    confidence_pct: float
    risk_level: str
    created_at: str


class USSDRequest(BaseModel):
    sessionId: str
    serviceCode: str
    phoneNumber: str
    text: str
