@echo off
setlocal enabledelayedexpansion

set BACKEND_PORT=8000
set FRONTEND_PORT=5173
set NO_FRONTEND=0

:parse
if "%~1"=="" goto :done_parse
if /i "%~1"=="--backend-port" (set BACKEND_PORT=%~2 & shift & shift & goto :parse)
if /i "%~1"=="--frontend-port" (set FRONTEND_PORT=%~2 & shift & shift & goto :parse)
if /i "%~1"=="--no-frontend" (set NO_FRONTEND=1 & shift & goto :parse)
if /i "%~1"=="--help" (
  echo Usage: %~nx0 [--backend-port PORT] [--frontend-port PORT] [--no-frontend]
  exit /b 0
)
echo Unknown flag: %~1 & exit /b 1
:done_parse

set ROOT_DIR=%~dp0..
set BACKEND_DIR=%ROOT_DIR%\backend
set FRONTEND_DIR=%ROOT_DIR%\frontend
set MODEL_DIR=%BACKEND_DIR%\models

echo ==============================================
echo    BudgetBeacon -- Starting Up
echo ==============================================
echo Root:      %ROOT_DIR%
echo Backend:   0.0.0.0:%BACKEND_PORT%
echo Frontend:  0.0.0.0:%FRONTEND_PORT%
echo.

echo [1/6] Checking prerequisites...

REM ----- Python -----
echo TRACE: checking Python...
python -c "import sys; v=sys.version_info; assert (3,10) <= (v.major, v.minor) <= (3,13), 'bad version'; print(f'Python {v.major}.{v.minor} -- OK')" 2>nul
if %errorlevel% neq 0 (
  python --version 2>nul || echo Python not found.
  echo Error: Python 3.10-3.13 required. Download from https://www.python.org/downloads/
  echo (Python 3.14+ breaks pydantic-core -- use 3.12 or 3.13)
  pause & exit /b 1
)

REM ----- Node.js -----
echo TRACE: checking Node...
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Node.js not found. Download from https://nodejs.org/
  pause & exit /b 1
)
node -p "process.version.slice(1)" >nul 2>&1
echo TRACE: Node found - getting version...
for /f "usebackq delims=" %%V in (`node -p "process.version.slice(1)"`) do set NODE_VER=%%V
echo   Node v%NODE_VER% -- OK

REM ----- npm -----
echo TRACE: checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: npm not found.
  pause & exit /b 1
)
echo.

REM ----- Directories -----
echo TRACE: checking directories...
if not exist "%BACKEND_DIR%" (echo Error: Backend dir not found & pause & exit /b 1)
if not exist "%FRONTEND_DIR%" (echo Error: Frontend dir not found & pause & exit /b 1)
if not exist "%BACKEND_DIR%\requirements.txt" (echo Error: requirements.txt missing & pause & exit /b 1)
if not exist "%FRONTEND_DIR%\package.json" (echo Error: package.json missing & pause & exit /b 1)

REM ----- Ports -----
echo TRACE: checking ports...
netstat -an | findstr ":%BACKEND_PORT% " >nul 2>&1 && (echo Error: Port %BACKEND_PORT% in use & pause & exit /b 1)
netstat -an | findstr ":%FRONTEND_PORT% " >nul 2>&1 && (echo Error: Port %FRONTEND_PORT% in use & pause & exit /b 1)

echo TRACE: all prerequisites passed.

REM ---- Backend setup ----
echo [2/6] Setting up Python virtual environment...
cd /d "%BACKEND_DIR%"
if not exist "venv" (python -m venv venv)
if %errorlevel% neq 0 (echo Error: venv creation failed & pause & exit /b 1)

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (echo Error: venv activation failed & pause & exit /b 1)

echo [3/6] Installing Python dependencies...
pip install -r requirements.txt -q
if %errorlevel% neq 0 (echo Error: pip install failed & pause & exit /b 1)

REM ---- Train ML models ----
echo [4/6] Checking ML models...
if not exist "%MODEL_DIR%\main_model.pkl" (
  echo   Models not found -- training now (first run, ~30 seconds)...
  python -m app.ml.train
  if %errorlevel% neq 0 (echo Error: training failed & pause & exit /b 1)
) else (
  echo   Models found -- skipping training.
)
if exist "%BACKEND_DIR%\oraph.db" (echo   Note: Database exists. Delete if schema changed.)

REM ---- Start backend ----
echo [5/6] Starting backend on 0.0.0.0:%BACKEND_PORT%...
start "BudgetBeacon - Backend" /min cmd /c "uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"
echo   Waiting for backend...
set READY=0
for /l %%i in (1,1,30) do (
  >nul 2>&1 curl -s http://127.0.0.1:%BACKEND_PORT%/health && set READY=1 && goto :backend_ready
  >nul 2>&1 timeout /t 1
)
:backend_ready
if %READY% equ 0 (echo Error: Backend not ready in 30s & pause & exit /b 1)
echo   Backend is ready!
echo   API Docs: http://127.0.0.1:%BACKEND_PORT%/docs
echo.

REM ---- Start frontend ----
if "%NO_FRONTEND%"=="0" (
  echo [6/6] Starting frontend on 0.0.0.0:%FRONTEND_PORT%...
  cd /d "%FRONTEND_DIR%"
  npm install --silent >nul 2>&1 || echo Warning: npm install had issues.
  set VITE_API_URL=http://127.0.0.1:%BACKEND_PORT%
  start "BudgetBeacon - Frontend" /min cmd /c "npx vite --host 0.0.0.0 --port %FRONTEND_PORT%"
  echo   Frontend: http://127.0.0.1:%FRONTEND_PORT%
  echo.
)

REM ---- Summary ----
echo ==============================================
echo    BudgetBeacon is running!
echo    Frontend:  http://127.0.0.1:%FRONTEND_PORT%
echo    Backend:   http://127.0.0.1:%BACKEND_PORT%
echo    API Docs:  http://127.0.0.1:%BACKEND_PORT%/docs
echo    Close this window to stop all services.
echo ==============================================
pause
