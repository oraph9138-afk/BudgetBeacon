# How BudgetBeacon Works

## What Is BudgetBeacon?

BudgetBeacon is an intelligent cost estimation system designed for small and medium businesses, particularly in Tanzania and East Africa. It predicts business costs using machine learning and provides a **confidence score** so users know how reliable each estimate is.

Instead of just saying *"Your cost is Tsh 1,000,000"*, it also says *"Confidence level is 85%"* — giving business owners the information they need to make informed financial decisions.

---

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   User      │────▶│  Frontend   │────▶│   Backend    │
│  (Browser   │     │  (React)    │     │   (FastAPI)  │
│   or USSD)  │◀────│             │◀────│              │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │  ML Models   │
                                        │  (XGBoost)   │
                                        └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │  Database    │
                                        │  (SQLite)    │
                                        └──────────────┘
```

---

## How It Works Step by Step

### 1. User Enters Business Data

The user fills out a form with the following information:

| Field | Example | Purpose |
|-------|---------|---------|
| Business Type | Agriculture | Helps the model apply industry-specific patterns |
| Material Cost | Tsh 500,000 | Base cost of raw materials |
| Transport Cost | Tsh 150,000 | Shipping and logistics costs |
| Labor Cost | Tsh 200,000 | Wages and human resources |
| Production Days | 14 | Time required to complete the work |
| Quantity | 100 | Number of units being produced |
| Location | Dar es Salaam | Regional cost variations (shipping, wages, etc.) |

### 2. Frontend Sends Data to Backend

The React frontend packages the form data into a JSON object and sends it to the backend API:

```
POST http://localhost:8000/api/estimate
{
  "business_type": "agriculture",
  "material_cost": 500000,
  "transport_cost": 150000,
  "labor_cost": 200000,
  "production_days": 14,
  "quantity": 100,
  "location": "Dar es Salaam"
}
```

### 3. Backend Processes the Request

When the FastAPI backend receives the request, it:

1. **Validates** the input data (ensures all fields are present and correct types)
2. **Encodes** categorical fields:
   - `business_type` → numeric index (agriculture=0, retail=1, etc.)
   - `location` → numeric index (Dar es Salaam=0, Arusha=1, etc.)
3. **Passes** the encoded data to the ML prediction service

### 4. ML Models Generate Predictions

Three separate models work together:

```
┌─────────────────────┐
│   Input Features    │
│   (7 encoded values)│
└──────────┬──────────┘
           │
     ┌─────┴─────┬─────────────────────┐
     ▼           ▼                     ▼
┌──────────┐ ┌──────────┐       ┌──────────┐
│  Main    │ │  Lower   │       │  Upper   │
│  Model   │ │  Quantile│       │  Quantile│
│  (mean)  │ │  (10th%) │       │  (90th%) │
└────┬─────┘ └────┬─────┘       └────┬─────┘
     │            │                  │
     ▼            ▼                  ▼
  Tsh 1.2M     Tsh 1.0M          Tsh 1.4M
```

#### Main Model (Mean Prediction)
- Uses a **Gradient Boosting Regressor** (XGBoost)
- Trained on 5,000+ data points with known business costs
- Outputs the predicted total cost

#### Quantile Models (Confidence Range)
- **Lower model**: Predicts the 10th percentile cost (best case)
- **Upper model**: Predicts the 90th percentile cost (worst case)
- The gap between these two predictions determines the confidence score

### 5. Confidence Score Calculation

The system calculates confidence using this formula:

```
Prediction Interval = Upper Prediction - Lower Prediction
Confidence = (1 - (Interval / Main Prediction)) × 100
```

**Example:**
```
Main Prediction:  Tsh 1,214,468
Lower (10th%):    Tsh 1,100,000
Upper (90th%):    Tsh 1,300,000
Interval:         Tsh 200,000

Confidence = (1 - (200,000 / 1,214,468)) × 100 = 83.5%
```

### 6. Risk Level Assignment

Based on the confidence score:

| Confidence Range | Risk Level | Meaning |
|------------------|------------|---------|
| 75% - 100% | **Low** | Estimate is reliable; plan with confidence |
| 50% - 74% | **Medium** | Moderate reliability; gather more data if possible |
| 0% - 49% | **High** | Low reliability; use as a rough guide only |

### 7. Response Sent Back to User

```json
{
  "predicted_cost": 1214468.39,
  "confidence_pct": 87.9,
  "risk_level": "Low",
  "breakdown": {
    "material": 500000.0,
    "transport": 150000.0,
    "labor": 200000.0,
    "overhead_estimated": 364468.39
  }
}
```

### 8. Frontend Displays Results

The React app renders:
- **Total cost** in large text
- **Confidence bar** (green/yellow/red based on score)
- **Risk badge** (Low/Medium/High)
- **Cost breakdown** table showing each component
- **Insight message** explaining what the confidence level means

### 9. Estimate Saved to Database

Every estimate is stored in SQLite with a timestamp, so users can:
- View their **history** on the dashboard
- See **trends** in their estimates over time
- View a **bar chart** of recent estimates

---

## USSD/SMS Flow (Mobile Users)

For users without smartphones or internet:

```
User dials: *150*X#
    │
    ├─── CON Select business type:
    │      1. Agriculture
    │      2. Retail/Trade
    │      3. Manufacturing
    │      4. Transport
    │      5. Services
    │
    ├─── CON Enter material cost (Tsh):
    │
    ├─── CON Enter transport cost (Tsh):
    │
    ├─── CON Enter labor cost (Tsh):
    │
    ├─── CON Enter production days:
    │
    └─── END Cost: Tsh 1,214,468 | Confidence: 88% | Risk: Low
```

The USSD endpoint (`POST /api/ussd/webhook`) receives callbacks from Africa's Talking, maintains session state, and returns the appropriate menu or final result at each step.

---

## ML Model Training

### Current State
- Models are trained on **synthetic data** (5,000 samples)
- Data simulates realistic business cost patterns with:
  - Business type multipliers
  - Location cost variations
  - Overhead ratios (5-25% of base costs)
  - 5% random noise to simulate real-world variability

### Training R² Score: 0.98

### To Retrain with Real Data

1. Replace the `generate_synthetic_data()` function in `backend/app/ml/train.py` with a function that loads your CSV dataset
2. Ensure your dataset has these columns:
   - `business_type_idx` (0-4)
   - `location_idx` (0-6)
   - `material_cost`
   - `transport_cost`
   - `labor_cost`
   - `production_days`
   - `quantity`
   - `actual_cost` (the target — what the model learns to predict)
3. Run: `python -m app.ml.train`

The three models will be saved as `.pkl` files in `backend/models/`.

---

## Database Schema

```
estimates
├── id (auto-increment)
├── business_type
├── material_cost
├── transport_cost
├── labor_cost
├── production_days
├── quantity
├── location
├── predicted_cost
├── confidence_pct
├── risk_level
└── created_at (timestamp)
```

---

## Key Files Explained

| File | Role |
|------|------|
| `backend/app/main.py` | FastAPI application entry point, CORS setup, route registration |
| `backend/app/schemas.py` | Pydantic models that validate API request/response data |
| `backend/app/database.py` | SQLAlchemy engine, session management, Estimate table definition |
| `backend/app/config.py` | Configuration constants (database URL, business types, risk thresholds) |
| `backend/app/ml/train.py` | Generates data and trains the three ML models |
| `backend/app/ml/predict.py` | Loads trained models, encodes inputs, generates predictions and confidence |
| `backend/app/routes/estimate.py` | Handles POST /api/estimate — validates, predicts, saves, returns |
| `backend/app/routes/history.py` | Handles GET /api/history — returns sorted list of past estimates |
| `backend/app/routes/ussd.py` | Handles POST /api/ussd/webhook — USSD session state machine |
| `frontend/src/App.jsx` | React router setup, header navigation |
| `frontend/src/pages/Home.jsx` | Landing page with hero section and feature cards |
| `frontend/src/pages/NewEstimate.jsx` | Form page with 7 input fields, calls API, displays results |
| `frontend/src/pages/History.jsx` | Dashboard with stats cards, bar chart, and estimates table |
| `frontend/src/components/ResultCard.jsx` | Displays prediction results with confidence bar and risk badge |
| `frontend/src/services/api.js` | Axios-based API client for backend communication |

---

## Request Flow Diagram

```
User fills form → React component
                      │
                      ▼
              createEstimate(data)
                      │
                      ▼
              POST /api/estimate (JSON)
                      │
                      ▼
              FastAPI receives request
                      │
                      ▼
              Pydantic validation (schemas.py)
                      │
                      ▼
              PredictionService.predict(data)
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
         main     lower   upper
         model    model   model
              │       │       │
              ▼       ▼       ▼
         cost     lower   upper
         pred     bound   bound
                      │
                      ▼
              Calculate confidence & risk
                      │
                      ▼
              Save to database
                      │
                      ▼
              Return JSON response
                      │
                      ▼
              ResultCard displays results
```

---

## Security Considerations

- **CORS**: Backend allows only localhost origins in development (configured in `main.py`)
- **Input validation**: Pydantic schemas enforce correct data types
- **SQL injection protection**: SQLAlchemy ORM parameterizes all queries
- **Rate limiting**: Should be added before production deployment
- **Data privacy**: No personal data collected beyond phone/email (future feature)

---

## How to Extend

### Add Real Data
Replace synthetic data with actual business cost records from Tanzania.

### Add User Authentication
Implement JWT or session-based auth to tie estimates to specific users.

### Add Africa's Talking Integration
Sign up at africastalking.com, get API credentials, and configure the USSD service code in `ussd.py`.

### Add Swahili Support
Create language toggle in frontend and translate all UI strings.

### Deploy to Production
- Backend: Docker container on a VPS (DigitalOcean, AWS)
- Frontend: Build (`npm run build`) and serve via Nginx
- Database: Migrate from SQLite to PostgreSQL
