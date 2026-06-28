# System Design: AI Business Cost Estimation & Certainty Prediction

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Web App     │  │  USSD/SMS    │  │  Mobile (future) │   │
│  │  (React)     │  │  (Africa's   │  │                  │   │
│  │              │  │   Talking)   │  │                  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                    │             │
└─────────┼─────────────────┼────────────────────┼─────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
│                    (FastAPI)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/estimate│  │ /api/history │  │ /api/ussd/webhook│   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼─────────────────┼────────────────────┼─────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────────────┐  ┌───────────────────────────────┐    │
│  │ ML Prediction    │  │ USSD Session Manager          │    │
│  │ Service          │  │                               │    │
│  │                  │  │                               │    │
│  │ - Cost Model     │  │ - State machine               │    │
│  │ - Confidence     │  │ - Menu rendering              │    │
│  │ - Quantile Reg   │  │ - Input collection            │    │
│  └────────┬─────────┘  └───────────────┬───────────────┘    │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ PostgreSQL   │  │ ML Models    │  │  Redis (cache)   │   │
│  │ / SQLite     │  │ (.pkl files) │  │  (USSD sessions) │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Model

### 2.1 Database Schema (SQLite for dev, PostgreSQL for prod)

```sql
-- Users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    phone         VARCHAR(15) UNIQUE,
    email         VARCHAR(255) UNIQUE,
    business_type VARCHAR(50),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- Cost Estimates
CREATE TABLE estimates (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    business_type   VARCHAR(50) NOT NULL,
    material_cost   DECIMAL(12,2),
    transport_cost  DECIMAL(12,2),
    labor_cost      DECIMAL(12,2),
    production_days INTEGER,
    quantity        INTEGER,
    location        VARCHAR(100),
    predicted_cost  DECIMAL(12,2),
    confidence_pct  DECIMAL(5,2),
    risk_level      VARCHAR(10),  -- Low, Medium, High
    created_at      TIMESTAMP DEFAULT NOW()
);

-- USSD Sessions
CREATE TABLE ussd_sessions (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(15) NOT NULL,
    session_id  VARCHAR(64) UNIQUE,
    state       VARCHAR(50),  -- menu state
    input_data  JSONB,
    created_at  TIMESTAMP DEFAULT NOW(),
    expires_at  TIMESTAMP
);
```

## 3. ML Model Design

### 3.1 Cost Estimation Model
- **Algorithm:** Gradient Boosting Regressor (XGBoost or sklearn)
- **Features:** business_type (encoded), material_cost, transport_cost, labor_cost, production_days, quantity, location (encoded)
- **Target:** actual_total_cost

### 3.2 Confidence Score Calculation
- **Method:** Conformal Prediction (Quantile Regression)
- Train two additional models:
  - Lower quantile model (10th percentile)
  - Upper quantile model (90th percentile)
- Confidence = 1 - (prediction_interval_width / predicted_value)
- Calibrated to ensure 80% confidence ≈ 80% of estimates fall within range

### 3.3 Risk Level Mapping
| Confidence | Risk  |
|------------|-------|
| 75-100%    | Low   |
| 50-74%     | Medium|
| 0-49%      | High  |

## 4. API Endpoints

### POST /api/estimate
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
  "predicted_cost": 1050000,
  "confidence_pct": 82.5,
  "risk_level": "Low",
  "breakdown": {
    "material": 500000,
    "transport": 150000,
    "labor": 200000,
    "overhead_estimated": 200000
  }
}
```

### GET /api/history?user_id={id}
Returns list of past estimates with timestamps.

### POST /api/ussd/webhook
Handles USSD session callbacks from Africa's Talking.

## 5. Frontend Architecture (React)

```
src/
├── components/
│   ├── Layout/          # Header, Sidebar, Footer
│   ├── EstimateForm/    # Input form for cost data
│   ├── Results/         # Cost display + confidence meter
│   ├── Dashboard/       # Charts, history table
│   └── common/          # Buttons, inputs, modals
├── pages/
│   ├── Home/
│   ├── Dashboard/
│   ├── NewEstimate/
│   └── History/
├── services/
│   ├── api.js           # Axios instance + endpoints
│   └── ml.js            # Client-side helpers
├── context/
│   └── AuthContext.jsx
└── App.jsx
```

## 6. Project Structure

```
BudgetBeacon/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── estimate.py
│   │   │   ├── history.py
│   │   │   └── ussd.py
│   │   ├── ml/
│   │   │   ├── train.py         # Model training
│   │   │   ├── predict.py       # Inference
│   │   │   └── confidence.py    # Conformal prediction
│   │   ├── database.py
│   │   └── config.py
│   ├── models/                  # Trained .pkl files
│   ├── data/                    # Training data (CSV)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## 7. USSD Flow (Africa's Talking)

```
User dials *150*X#
  │
  ├─ CON Enter business type:
  │     1. Agriculture
  │     2. Retail/Trade
  │     3. Manufacturing
  │     4. Transport
  │
  ├─ CON Enter material cost (Tsh):
  │
  ├─ CON Enter transport cost (Tsh):
  │
  ├─ CON Enter labor cost (Tsh):
  │
  ├─ CON Enter production days:
  │
  └─ END Cost: Tsh 1,050,000 | Confidence: 82% | Risk: Low
```

## 8. Security & Deployment

- HTTPS for all web traffic
- Phone number validation for USSD
- Rate limiting on API (10 req/min per IP)
- Input sanitization on all endpoints
- Deploy: Docker containers on a VPS (DigitalOcean/AWS)
- Database backups: daily automated

## 9. Development Phases

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | Week 1-2 | Backend + ML model (trained on synthetic data) |
| 2 | Week 3-4 | Frontend dashboard + estimate form |
| 3 | Week 5 | API integration + full flow testing |
| 4 | Week 6 | USSD integration + deployment |
| 5 | Week 7-8 | Real data training + calibration |
