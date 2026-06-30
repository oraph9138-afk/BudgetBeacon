# BudgetBeacon — Running the Project

This guide explains how to use the one-command scripts to start the entire project (backend + frontend) with a single command.

---

## Prerequisites

- **Python 3.10–3.13** (3.14 not supported — breaks `pydantic-core`)
- **Node.js 20+** and **npm 9+**
- **Git** (to clone the repository)

---

## Scripts Location

All scripts live in the `script/` directory at the project root:

```
BudgetBeacon/
└── script/
    ├── run.sh        # Linux / macOS (Bash)
    ├── run.bat       # Windows (Command Prompt — double-click friendly)
    └── run.ps1       # Windows (PowerShell)
```

---

## Linux / macOS

### 1. Make executable (first time only)

```bash
chmod +x script/run.sh
```

### 2. Run it

```bash
./script/run.sh
```

The script will:

1. **Pre-flight checks** — verifies Python 3.10–3.13, Node.js, npm, curl are installed; validates ports are free
2. Create a Python virtual environment (`backend/venv/`)
3. Install all Python dependencies (auto-detects Debian/Ubuntu for `--break-system-packages`)
4. Train the XGBoost ML models (first run only — generates 3 `.pkl` files, ~30 seconds)
5. Start the FastAPI backend on `http://127.0.0.1:8000` (waits up to 30s for readiness)
6. Install npm dependencies
7. Start the Vite frontend on `http://127.0.0.1:5173`
8. Print a summary with clickable URLs

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

## Windows — Command Prompt (recommended)

The `run.bat` script works by **double-click** in File Explorer — no special setup needed.

### 1. Open the BudgetBeacon folder

```cmd
cd C:\path\to\BudgetBeacon
```

### 2. Run it

**Double-click** `script\run.bat` in Explorer, **or** from a terminal:

```cmd
script\run.bat
```

### Optional flags

```cmd
script\run.bat --backend-port 8080 --frontend-port 3000
script\run.bat --no-frontend
```

### 3. Stop

Press any key (the window shows "Press any key to exit") or close the window.

---

## Windows — PowerShell

### 1. Open PowerShell in the project folder

```powershell
cd C:\path\to\BudgetBeacon
```

### 2. Run the script

```powershell
.\script\run.ps1
```

**If you get an execution policy error:**

```powershell
powershell -ExecutionPolicy Bypass -File .\script\run.ps1
```

Or run this once to allow the current session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\script\run.ps1
```

### Why `.ps1` opens Notepad when double-clicked

This is **default Windows behavior** — `.ps1` files are registered to open in Notepad for safety. Always run PowerShell scripts from a terminal, or use `run.bat` for double-click.

### Optional flags

```powershell
.\script\run.ps1 -BackendPort 8080 -FrontendPort 3000
.\script\run.ps1 -NoFrontend
```

---

## What the Scripts Check (Error Handling)

All three scripts perform these checks before starting:

| Check | What happens on failure |
|-------|------------------------|
| OS compatibility | Linux/macOS script rejects Windows; .bat/.ps1 rejects Linux |
| Python version (3.10–3.13) | Clear error: "Python 3.10–3.13 required, got X.Y" |
| Node.js installed | Error with download link |
| npm installed | Error message |
| Python venv creation | Fails with "Failed to create virtual environment" |
| pip install | Error with internet connection hint |
| ML model training | Error prompting manual debug |
| Port availability | Error with port number and `--port` flag hint |
| Backend starts within 30s | Timeout error with process output |
| Frontend starts | Warning if process exits immediately |
| Project directories exist | Error showing expected path |

---

## URLs After Starting

| Service | URL |
|---------|-----|
| Frontend app | `http://127.0.0.1:5173` |
| Backend API | `http://127.0.0.1:8000` |
| Swagger docs | `http://127.0.0.1:8000/docs` |

---

## Manual Start (without scripts)

### Backend

```bash
cd BudgetBeacon/backend
source venv/bin/activate              # Linux/macOS
# .\venv\Scripts\Activate.ps1        # Windows PowerShell
# venv\Scripts\activate.bat          # Windows CMD
pip install -r requirements.txt
python -m app.ml.train                # Train models (first time only)
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
|---------|------|
| `pip install` fails on Ubuntu/Debian | The script auto-detects this and adds `--break-system-packages`. If running manually, add the flag. |
| Port 8000 already in use | Kill old process: `fuser -k 8000/tcp` (Linux) or `netstat -ano \| findstr :8000` then `taskkill /PID <id>` (Windows). Or use the `--port` flag. |
| Python not found | Use `python3` on Linux/macOS; ensure Python is in PATH on Windows. |
| Python 3.14 error | Use Python 3.12 or 3.13 — `pydantic-core` does not support 3.14. |
| npm not found | Install Node.js from https://nodejs.org |
| Database errors | Delete `backend/oraph.db` and restart — SQLite recreates it. |
| Backend starts but frontend blank | Check browser console for CORS errors. Ensure backend is on port 8000. |
| `.ps1` opens in Notepad | Use `run.bat` instead (double-click), or run `.ps1` from a PowerShell terminal. |
| Script says "command not found" | Ensure the tool is installed and in your system PATH. |
| Frontend port 5173 in use | Use `--frontend-port 5174` or stop the other Vite process. |
