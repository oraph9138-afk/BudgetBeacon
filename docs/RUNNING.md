# BudgetBeacon — Running the Project

This guide explains how to use the one-command scripts to start the entire project (backend + frontend) with a single command.

---

## Prerequisites

- **Python 3.12+** (3.14 not supported — use 3.12 or 3.13)
- **Node.js 20+** and **npm 9+**
- **Git** (to clone the repository)

---

## Scripts Location

Both scripts live in the `script/` directory at the project root:

```
BudgetBeacon/
└── script/
    ├── run.sh        # Linux / macOS (Bash)
    └── run.ps1       # Windows (PowerShell)
```

---

## Linux / macOS

### 1. Make the script executable (first time only)

```bash
chmod +x script/run.sh
```

### 2. Run it

```bash
./script/run.sh
```

The script will:

1. Create a Python virtual environment (`backend/venv/`)
2. Install all Python dependencies
3. Train the XGBoost ML models (first run only — generates 3 `.pkl` files)
4. Start the FastAPI backend on `http://127.0.0.1:8000`
5. Install npm dependencies
6. Start the Vite frontend on `http://127.0.0.1:5173`
7. Print a summary with clickable URLs

### 3. Stop

Press **`Ctrl+C`** — both servers shut down automatically.

### Optional flags

```bash
# Different ports
./script/run.sh --backend-port 8080 --frontend-port 3000

# Backend only (no frontend)
./script/run.sh --no-frontend
```

---

## Windows (PowerShell)

### 1. Open PowerShell

Right-click → "Run as Administrator" is not required, but ensure you are in the project root directory.

### 2. Run the script

```powershell
.\script\run.ps1
```

**If you get an execution policy error:**

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\script\run.ps1
```

The script will:

1. Create a Python virtual environment (`backend\venv\`)
2. Install all Python dependencies
3. Train the XGBoost ML models (first run only)
4. Start the FastAPI backend on `http://127.0.0.1:8000`
5. Install npm dependencies
6. Start the Vite frontend on `http://127.0.0.1:5173`
7. Print a summary with URLs

### 3. Stop

Press **`Ctrl+C`** — both servers shut down automatically.

### Optional flags

```powershell
# Different ports
.\script\run.ps1 -BackendPort 8080 -FrontendPort 3000

# Backend only (no frontend)
.\script\run.ps1 -NoFrontend
```

---

## URLs After Starting

| Service | URL |
|---------|-----|
| Frontend app | `http://127.0.0.1:5173` |
| Backend API | `http://127.0.0.1:8000` |
| Swagger docs | `http://127.0.0.1:8000/docs` |

---

## Manual Start (without scripts)

If you prefer to start each service manually:

### Backend

```bash
cd BudgetBeacon/backend
source venv/bin/activate      # Linux/macOS
# venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
python -m app.ml.train                   # Train models (first time)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd BudgetBeacon/frontend
npm install
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pip install` fails on Ubuntu/Debian | The script auto-detects this and adds `--break-system-packages`. If running manually, add the flag. |
| Port 8000 already in use | Kill the old process: `fuser -k 8000/tcp` (Linux) or `netstat -ano \| findstr :8000` then `taskkill /PID <id>` (Windows). Or use `--backend-port`/`-BackendPort` to pick a different port. |
| "python" not found | Use `python3` on Linux/macOS, or ensure Python is in your PATH on Windows. |
| "npm" not found | Install Node.js from https://nodejs.org |
| Database errors | Delete `backend/oraph.db` and restart — SQLite recreates it. |
| Backend starts but frontend shows blank page | Check the browser console for CORS errors. Ensure the backend is running on port 8000 (or the port matching `VITE_API_URL`). |
