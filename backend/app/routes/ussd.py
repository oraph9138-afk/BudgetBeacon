from fastapi import APIRouter, Form
from app.ml.predict import prediction_service
from app.schemas import EstimateInput

router = APIRouter(prefix="/api", tags=["ussd"])

SESSIONS = {}


def parse_session(session_id: str, text: str):
    steps = text.split("*")
    step_count = len(steps)

    if text == "":
        return (
            "CON Select business type:\n"
            "1. Agriculture\n"
            "2. Retail/Trade\n"
            "3. Manufacturing\n"
            "4. Transport\n"
            "5. Services"
        )

    if step_count == 1 and steps[0] in ["1", "2", "3", "4", "5"]:
        return "CON Enter material cost (Tsh):"

    if step_count == 2:
        return "CON Enter transport cost (Tsh):"

    if step_count == 3:
        return "CON Enter labor cost (Tsh):"

    if step_count == 4:
        return "CON Enter production days:"

    if step_count == 5:
        business_map = {"1": "agriculture", "2": "retail", "3": "manufacturing", "4": "transport", "5": "services"}
        business_type = business_map.get(steps[0], "agriculture")

        try:
            data = EstimateInput(
                business_type=business_type,
                material_cost=float(steps[1]),
                transport_cost=float(steps[2]),
                labor_cost=float(steps[3]),
                production_days=int(steps[4]),
                quantity=1,
                location="Dar es Salaam",
            )
            result = prediction_service.predict(data)
            return (
                f"END Cost Estimate: Tsh {result['predicted_cost']:,.0f}\n"
                f"Confidence: {result['confidence_pct']}%\n"
                f"Risk Level: {result['risk_level']}"
            )
        except Exception:
            return "END Error processing your request. Please try again."

    return "CON Enter production days:"


@router.post("/ussd/webhook")
def ussd_webhook(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text: str = Form(""),
):
    response = parse_session(sessionId, text)
    return {"response": response}
