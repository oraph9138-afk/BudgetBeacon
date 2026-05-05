import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from app.config import MODEL_DIR, DATA_DIR, BUSINESS_TYPES, LOCATIONS


def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)

    business_type_idx = np.random.randint(0, len(BUSINESS_TYPES), n_samples)
    location_idx = np.random.randint(0, len(LOCATIONS), n_samples)

    material_cost = np.random.uniform(50000, 2000000, n_samples)
    transport_cost = np.random.uniform(10000, 500000, n_samples)
    labor_cost = np.random.uniform(50000, 1000000, n_samples)
    production_days = np.random.randint(1, 90, n_samples)
    quantity = np.random.randint(1, 1000, n_samples)

    overhead = (material_cost + transport_cost + labor_cost) * np.random.uniform(0.05, 0.25, n_samples)
    business_multiplier = np.array([1.0, 0.8, 1.2, 0.9, 0.7])[business_type_idx]
    location_multiplier = np.array([1.1, 1.0, 0.95, 0.85, 1.05, 0.9, 0.8])[location_idx]

    base_cost = material_cost + transport_cost + labor_cost + overhead
    noise = np.random.normal(0, base_cost * 0.05, n_samples)
    actual_cost = (base_cost * business_multiplier * location_multiplier) + noise
    actual_cost = np.maximum(actual_cost, 10000)

    df = pd.DataFrame({
        "business_type_idx": business_type_idx,
        "location_idx": location_idx,
        "material_cost": material_cost,
        "transport_cost": transport_cost,
        "labor_cost": labor_cost,
        "production_days": production_days,
        "quantity": quantity,
        "actual_cost": actual_cost,
    })

    return df


def train_models():
    print("Generating synthetic training data...")
    df = generate_synthetic_data()

    feature_cols = [
        "business_type_idx", "location_idx", "material_cost",
        "transport_cost", "labor_cost", "production_days", "quantity"
    ]
    X = df[feature_cols].values
    y = df["actual_cost"].values

    print("Training main cost estimation model...")
    main_model = GradientBoostingRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42
    )
    main_model.fit(X, y)

    print("Training lower quantile model (10th percentile)...")
    lower_model = GradientBoostingRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.1,
        loss="quantile", alpha=0.1, random_state=42
    )
    lower_model.fit(X, y)

    print("Training upper quantile model (90th percentile)...")
    upper_model = GradientBoostingRegressor(
        n_estimators=200, max_depth=5, learning_rate=0.1,
        loss="quantile", alpha=0.9, random_state=42
    )
    upper_model.fit(X, y)

    os.makedirs(MODEL_DIR, exist_ok=True)

    main_path = os.path.join(MODEL_DIR, "main_model.pkl")
    lower_path = os.path.join(MODEL_DIR, "lower_model.pkl")
    upper_path = os.path.join(MODEL_DIR, "upper_model.pkl")

    joblib.dump(main_model, main_path)
    joblib.dump(lower_model, lower_path)
    joblib.dump(upper_model, upper_path)

    train_score = main_model.score(X, y)
    print(f"Models saved. Training R² score: {train_score:.4f}")
    return main_model, lower_model, upper_model


if __name__ == "__main__":
    train_models()
