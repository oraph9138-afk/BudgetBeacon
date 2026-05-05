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
Oraph/
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

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Train ML models (first time only)
python -m app.ml.train

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
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

- **Algorithm:** Gradient Boosting Regressor (XGBoost)
- **Confidence:** Quantile regression (10th and 90th percentiles)
- **Current Training:** Synthetic data (5000 samples)
- **R² Score:** ~0.98

To retrain with real data, replace the synthetic data generator in `backend/app/ml/train.py` with your dataset and run:
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
