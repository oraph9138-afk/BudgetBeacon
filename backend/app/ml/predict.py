import joblib
import numpy as np
import os
from app.config import MODEL_DIR, BUSINESS_TYPES, LOCATIONS, RISK_THRESHOLDS


class PredictionService:
    def __init__(self):
        self.main_model = None
        self.lower_model = None
        self.upper_model = None
        self._load_or_train()

    def _load_or_train(self):
        main_path = os.path.join(MODEL_DIR, "main_model.pkl")
        lower_path = os.path.join(MODEL_DIR, "lower_model.pkl")
        upper_path = os.path.join(MODEL_DIR, "upper_model.pkl")

        if all(os.path.exists(p) for p in [main_path, lower_path, upper_path]):
            try:
                self.main_model = joblib.load(main_path)
                self.lower_model = joblib.load(lower_path)
                self.upper_model = joblib.load(upper_path)
                print("✅ ML models loaded successfully.")
            except Exception as e:
                print(f"⚠️  Failed to load models: {e}. Retraining...")
                self._train()
        else:
            print("📦 No models found. Training now...")
            self._train()

    def _train(self):
        from app.ml.train import train_models
        self.main_model, self.lower_model, self.upper_model = train_models()

    def _encode_input(self, data):
        business_type_idx = (
            BUSINESS_TYPES.index(data.business_type)
            if data.business_type in BUSINESS_TYPES
            else 0
        )
        location_idx = (
            LOCATIONS.index(data.location)
            if data.location in LOCATIONS
            else len(LOCATIONS) - 1
        )
        return np.array([[
            business_type_idx,
            location_idx,
            data.material_cost,
            data.transport_cost,
            data.labor_cost,
            data.production_days,
            data.quantity,
        ]], dtype=np.float64)

    def predict(self, data) -> dict:
        if not all([self.main_model, self.lower_model, self.upper_model]):
            raise RuntimeError("Models are not loaded. Run python -m app.ml.train first.")

        X = self._encode_input(data)

        predicted = float(self.main_model.predict(X)[0])
        lower = float(self.lower_model.predict(X)[0])
        upper = float(self.upper_model.predict(X)[0])

        # Protect against division by zero
        if predicted <= 0:
            predicted = 1.0

        interval_width = max(0.0, upper - lower)
        confidence = max(0.0, min(100.0, (1 - interval_width / predicted) * 100))

        if confidence >= RISK_THRESHOLDS["low"]:
            risk = "Low"
        elif confidence >= RISK_THRESHOLDS["medium"]:
            risk = "Medium"
        else:
            risk = "High"

        total_inputs = data.material_cost + data.transport_cost + data.labor_cost
        overhead = max(0.0, predicted - total_inputs)

        return {
            "predicted_cost": round(predicted, 2),
            "confidence_pct": round(confidence, 1),
            "risk_level": risk,
            "breakdown": {
                "material": round(data.material_cost, 2),
                "transport": round(data.transport_cost, 2),
                "labor": round(data.labor_cost, 2),
                "overhead_estimated": round(overhead, 2),
            },
        }


# Singleton — loaded once when the server starts
prediction_service = PredictionService()
