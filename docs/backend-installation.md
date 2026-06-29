# Backend Installation Guide

## Prerequisites

- **Python 3.9+** — check with: `python --version` or `python3 --version`
- **pip** — Python package manager (comes with Python)
- **Git** (optional) — to clone the repository

---

## Step-by-Step Installation

### Step 1: Navigate to the backend directory

```bash
cd /home/mrdino/Desktop/DTC/clients/oraph_collabo/BudgetBeacon/backend
```

### Step 2: Create a virtual environment (recommended)

A virtual environment isolates project dependencies so they don't conflict with other Python projects on your system.

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> Your terminal prompt should now show `(venv)` at the beginning.

### Step 3: Install Python dependencies

**With virtual environment active:**
```bash
pip install -r requirements.txt
```

**Without virtual environment (Ubuntu/Debian only — system packages not writeable):**
```bash
pip install --break-system-packages -r requirements.txt
```

**What gets installed:**

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115+ | Web framework for the API |
| `uvicorn` | 0.30+ | ASGI server to run FastAPI |
| `xgboost` | 2.1+ | ML engine (XGBoost — replaces scikit-learn entirely) |
| `numpy` | 1.26+ | Numerical computation |
| `pandas` | 2.2+ | Data manipulation |
| `pydantic` | 2.9+ | Data validation (used by FastAPI) |
| `sqlalchemy` | 2.0+ | Database ORM |
| `joblib` | 1.4+ | Model serialization |
| `python-multipart` | 0.0.27+ | Required for USSD webhook form data |

### Step 4: Train the ML models

This generates synthetic training data and creates the 3 prediction models:

```bash
python -m app.ml.train
```

**Expected output:**
```
Generating synthetic training data...
Training main cost estimation model...
Training lower quantile model (10th percentile)...
Training upper quantile model (90th percentile)...
Models saved. Training R² score: 0.9807
```

The trained model files will appear in `backend/models/`:
- `main_model.pkl` — expected cost predictor
- `lower_model.pkl` — 10th percentile predictor
- `upper_model.pkl` — 90th percentile predictor

> **Note:** The first training uses synthetic data. To use real business data, see the "Retrain with Real Data" section below.

### Step 5: Start the backend server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Startup output:**
u```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 6: Verify the server is running

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status": "healthy"}
```

Also test the root endpoint:

```bash
curl http://localhost:8000/
```

**Expected response:**
```json
{"message": "Oraph AI Cost Estimator API", "status": "running"}
```

### Step 7: View the API documentation

Open in your browser:

```
http://localhost:8000/docs
```

This shows the interactive Swagger UI where you can test all endpoints directly.

---

## Running in Production

For production deployment, do NOT use `--reload` flag:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

- `--workers 4` — scales to 4 worker processes for handling multiple requests
- Remove `--reload` — reload is only for development (auto-restarts on file changes)

---

## Retrain with Real Data

### Step 1: Prepare your CSV data

Create a CSV file (e.g., `backend/data/real_costs.csv`) with the following columns:

```csv
business_type_idx,location_idx,material_cost,transport_cost,labor_cost,production_days,quantity,actual_cost
0,0,500000,150000,200000,14,100,1250000
1,2,300000,80000,150000,7,50,650000
...
```

**Column reference:**

| Column | Values | Description |
|--------|--------|-------------|
| `business_type_idx` | 0-4 | 0=Agriculture, 1=Retail, 2=Manufacturing, 3=Transport, 4=Services |
| `location_idx` | 0-6 | 0=Dar es Salaam, 1=Arusha, 2=Mwanza, 3=Dodoma, 4=Zanzibar, 5=Mbeya, 6=Other |
| `material_cost` | float | Cost of raw materials in Tsh |
| `transport_cost` | float | Transport/logistics cost in Tsh |
| `labor_cost` | float | Labor/wages cost in Tsh |
| `production_days` | int | Number of production days |
| `quantity` | int | Number of units |
| `actual_cost` | float | **Target** — the actual total cost |

### Step 2: Modify the training script

Edit `backend/app/ml/train.py`. Replace the `generate_synthetic_data()` function with:

```python
def load_real_data():
    df = pd.read_csv(os.path.join(DATA_DIR, "real_costs.csv"))
    return df
```

Then change the call in `train_models()` from:

```python
df = generate_synthetic_data()
```

to:

```python
df = load_real_data()
```

### Step 3: Retrain

```bash
python -m app.ml.train
```

---

## Troubleshooting

### "pip: command not found"
Make sure Python and pip are installed:
```bash
sudo apt install python3 python3-pip   # Ubuntu/Debian
```

### "externally-managed-environment"
Your system is Ubuntu/Debian with PEP 668 protection. Use:
```bash
pip install --break-system-packages -r requirements.txt
```
Or better, use a virtual environment (Step 2).

### "python: command not found"
Try `python3` instead:
```bash
python3 -m venv venv
python3 -m app.ml.train
```

### "ModuleNotFoundError: No module named 'app'"
Make sure you are running commands from the `backend/` directory, not from the project root.

### Port 8000 already in use
Kill the existing process or use a different port:
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### "sqlite3.OperationalError: unable to open database file"
The database file `oraph.db` will be created automatically in the backend directory. Ensure the directory is writeable.

---

## Quick Start (TL;DR)

```bash
cd /home/mrdino/Desktop/DTC/clients/oraph_collabo/BudgetBeacon/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.ml.train
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
