from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    email: str
    password: str
    business_name: str = ""
    phone: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    business_name: str = ""
    phone: str = ""

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    business_name: str = ""
    phone: str = ""


class EstimateInput(BaseModel):
    business_type: str
    material_cost: float
    transport_cost: float
    labor_cost: float
    production_days: int
    quantity: int
    location: str
    currency: str = "TZS"


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
    currency: str = "TZS"
    tips: list[str] = []


class HistoryItem(BaseModel):
    id: int
    business_type: str
    predicted_cost: float
    confidence_pct: float
    risk_level: str
    currency: str = "TZS"
    created_at: str


class USSDRequest(BaseModel):
    sessionId: str
    serviceCode: str
    phoneNumber: str
    text: str
