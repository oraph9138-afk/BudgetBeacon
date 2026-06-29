# BudgetBeacon - Business Cost Estimation & Certainty Prediction

AI-powered system that helps businesses estimate costs and understand how reliable those estimates are.

## Features

- **Cost Estimation** - AI predicts total business costs based on input data
- **Confidence Scoring** - Shows reliability percentage for each estimate
- **Risk Level** - Categorizes estimates as Low, Medium, or High risk
- **Cost Breakdown** - Shows material, transport, labor, and overhead costs
- **Estimate History** - View past estimates with charts and statistics
- **USSD/SMS Support** - Access via mobile phones without internet (ready for integration)

## Project Structure

```
BudgetBeacon/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── schemas.py          # Pydantic models
│   │   ├── database.py         # SQLAlchemy setup
│   │   ├── config.py           # Configuration
│   │   ├── routes/             # API endpoints
│   │   │   ├── estimate.py     # Cost estimation endpoint
│   │   │   ├── history.py      # History endpoint
│   │   │   └── ussd.py         # USSD webhook endpoint
│   │   └── ml/                 # Machine learning module
│   │       ├── train.py        # Model training script
│   │       └── predict.py      # Prediction service
│   ├── models/                 # Trained model files
│   ├── data/                   # Training data
│   └── requirements.txt        # Python dependencies
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Main app with routing
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── NewEstimate.jsx # Estimate form
│   │   │   └── History.jsx     # History dashboard
│   │   ├── components/
│   │   │   └── ResultCard.jsx  # Results display
│   │   └── services/
│   │       └── api.js          # API client
│   └── package.json
└── SYSTEM_DESIGN.md            # System architecture document
```

## Getting Started

### Backend

**Linux / macOS:**
```bash
# 1. Navigate to the project
cd /home/mrdino/Desktop/DTC/clients/oraph_collabo/BudgetBeacon/backend

# 2. Install Python dependencies (use --break-system-packages on Ubuntu/Debian)
pip install --break-system-packages -r requirements.txt

# 3. Train the ML model (first time only — generates ~0.98 R² model)
python -m app.ml.train

# 4. Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Windows (PowerShell):**
```powershell
# 1. Navigate to the project
cd C:\path\to\BudgetBeacon\backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Train the ML model (first time only)
python -m app.ml.train

# 4. Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at: http://localhost:8000  
API docs (Swagger): http://localhost:8000/docs

### Frontend

**Linux / macOS:**
```bash
cd frontend
npm install
npm run dev
```

**Windows (PowerShell):**
```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## API Endpoints

### POST /api/estimate
Get a cost estimate with confidence score.

```json
Request:
{
  "business_type": "agriculture",
  "material_cost": 500000,
  "transport_cost": 150000,
  "labor_cost": 200000,
  "production_days": 14,
  "quantity": 100,
  "location": "Dar es Salaam"
}

Response:
{
  "predicted_cost": 1214468.39,
  "confidence_pct": 87.9,
  "risk_level": "Low",
  "breakdown": {
    "material": 500000,
    "transport": 150000,
    "labor": 200000,
    "overhead_estimated": 364468.39
  }
}
```

### GET /api/history
Get list of past estimates.

### POST /api/ussd/webhook
Handle USSD session callbacks from Africa's Talking.

## ML Model

- **Algorithm:** XGBoost (Gradient Boosting via `XGBRegressor`)

**The three models now use XGBoost exclusively:**

| Model | Purpose | Objective |
|-------|---------|-----------|
| **Main** | Predict expected cost | `reg:squarederror` |
| **Lower** | Best-case (10th percentile) | `reg:quantileerror`, alpha=0.1 |
| **Upper** | Worst-case (90th percentile) | `reg:quantileerror`, alpha=0.9 |
- **Confidence:** Quantile regression (10th and 90th percentiles)
- **Current Training:** Synthetic data (5000 samples)
- **R² Score:** ~0.98

### Logic Behind the ML

**Why Gradient Boosting?**
This algorithm builds a sequence of decision trees, where each tree corrects the errors of the previous one. It handles mixed data types (numeric fields like costs + categorical fields like business type) without needing complex preprocessing, and tends to outperform simpler models like linear regression on business cost data where relationships are non-linear (e.g., doubling production days doesn't always double costs linearly).

**Why 3 models instead of 1?**
Most prediction systems give one answer with no reliability indicator. BudgetBeacon trains 3 models to solve this:
- The **main model** learns the expected cost
- The **lower model** (alpha=0.1) purposely under-predicts — it learns what the 10th percentile looks like (90% of actual costs should be above this)
- The **upper model** (alpha=0.9) purposely over-predicts — it learns the 90th percentile (90% of actual costs should be below this)

If all 3 models agree closely, the gap is narrow → high confidence. If they disagree widely, the gap is wide → low confidence. This is called **quantile regression** and avoids the common mistake of assuming all predictions are equally reliable.

**Why confidence scores matter for business users:**
A farmer seeing "Tsh 1,200,000 ± 88% confidence" can treat that as a solid planning number. A trader seeing "Tsh 800,000 ± 40% confidence" knows to treat it as a rough ballpark and perhaps gather more data. Without the confidence score, both would seem equally reliable, leading to poor decisions.

**Confidence formula:**
```
Confidence % = (1 - (upper_bound - lower_bound) / predicted_cost) × 100
```
This normalizes the prediction interval relative to the predicted cost — a Tsh 100,000 gap is narrow for a Tsh 1M estimate (90% confidence) but wide for a Tsh 200K estimate (50% confidence).

### What `python -m app.ml.train` does

Runs `backend/app/ml/train.py`, which does 4 things in sequence:

**1. Generate synthetic training data** — Creates 5,000 rows with 7 features (business type, location, material/transport/labor costs, production days, quantity). The target `actual_cost` is calculated as `(costs + overhead) × business_multiplier × location_multiplier + noise`, simulating real-world patterns (farming vs retail costs, regional price differences).

**2. Train 3 XGBoost models** (no scikit-learn needed):

| Model | Purpose | Config |
|-------|---------|--------|
| **Main** | Predict expected cost | Standard regression |
| **Lower** | Predict best-case (10th percentile) | `quantile`, alpha=0.1 |
| **Upper** | Predict worst-case (90th percentile) | `quantile`, alpha=0.9 |

All use 200 decision trees, max depth 5, learning rate 0.1. The quantile models enable the **confidence score** by measuring how wide the prediction interval is.

**3. Save models** via `joblib.dump` into `backend/models/` as `.pkl` files.

**4. Report R² score** — currently ~0.98 on synthetic data.

### ML Libraries

| Library | Role |
|---------|------|
| **xgboost** (`XGBRegressor`) | ML engine — builds 200-tree ensembles |
| **numpy** | Random data generation and array math |
| **pandas** | DataFrame structure for model input |
| **joblib** | Serialize/deserialize trained models |

### Retrain with real data

Replace `generate_synthetic_data()` in `backend/app/ml/train.py` with a CSV loader, then run:

```bash
python -m app.ml.train
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) |
| ML | scikit-learn, XGBoost |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| USSD | Africa's Talking (ready) |

## Next Steps

1. Collect real business cost data for training
2. Integrate with Africa's Talking for USSD
3. Add user authentication
4. Deploy to production server
5. Add Swahili language support
