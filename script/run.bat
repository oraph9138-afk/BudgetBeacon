@echo off
REM ===========================================================================
REM BudgetBeacon — One-Command Runner
REM Windows Command Prompt (cmd.exe)
REM ===========================================================================
REM Usage:
REM   run.bat
REM
REM Flags:
REM   --backend-port PORT    Backend port (default: 8000)
REM   --frontend-port PORT   Frontend port (default: 5173)
REM   --no-frontend          Start backend only
REM ===========================================================================

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
echo Unknown flag: %~1
exit /b 1
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

REM ---- Pre-flight checks ----
echo [1/6] Checking prerequisites...

REM Check Python
python -c "import sys; sys.exit(0)" >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Python is not installed or not in PATH.
  echo Install Python 3.10-3.13 from https://www.python.org/downloads/
  pause
  exit /b 1
)

for /f %%V in ('python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"') do set PY_VER=%%V
for /f "tokens=1,2 delims=." %%a in ("%PY_VER%") do set PY_MAJOR=%%a & set PY_MINOR=%%b
if not "%PY_MAJOR%"=="3" (
  echo Error: Python 3 required, got %PY_VER%.
  pause & exit /b 1
)
if %PY_MINOR% lss 10 (
  echo Error: Python 3.10+ required, got %PY_VER%.
  pause & exit /b 1
)
if %PY_MINOR% gtr 13 (
  echo Error: Python 3.13 or lower required, got %PY_VER% ^(pydantic-core does not support 3.14^).
  pause & exit /b 1
)
echo   Python %PY_VER% -- OK

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Node.js is not installed. Download from https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=1" %%V in ('node --version') do set NODE_VER=%%V
echo   Node %NODE_VER% -- OK

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: npm is not installed.
  pause
  exit /b 1
)
echo.

REM Check directories
if not exist "%BACKEND_DIR%" (
  echo Error: Backend directory not found at %BACKEND_DIR%
  pause & exit /b 1
)
if not exist "%FRONTEND_DIR%" (
  echo Error: Frontend directory not found at %FRONTEND_DIR%
  pause & exit /b 1
)
if not exist "%BACKEND_DIR%\requirements.txt" (
  echo Error: requirements.txt not found in backend.
  pause & exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
  echo Error: package.json not found in frontend.
  pause & exit /b 1
)

REM Check port availability
netstat -an | findstr ":%BACKEND_PORT% " >nul 2>&1
if %errorlevel% equ 0 (
  echo Error: Port %BACKEND_PORT% (backend) is already in use.
  echo Use --backend-port to pick a different port.
  pause & exit /b 1
)
netstat -an | findstr ":%FRONTEND_PORT% " >nul 2>&1
if %errorlevel% equ 0 (
  echo Error: Port %FRONTEND_PORT% (frontend) is already in use.
  echo Use --frontend-port to pick a different port.
  pause & exit /b 1
)

REM ---- Backend setup ----
echo [2/6] Setting up Python virtual environment...
cd /d "%BACKEND_DIR%"

if not exist "venv" (
  python -m venv venv
  if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment.
    pause & exit /b 1
  )
)

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
  echo Error: Failed to activate virtual environment.
  pause & exit /b 1
)

echo [3/6] Installing Python dependencies...
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
  echo Error: pip install failed. Check your internet connection.
  pause & exit /b 1
)

REM ---- Train ML models ----
echo [4/6] Checking ML models...
if not exist "%MODEL_DIR%\main_model.pkl" (
  echo   Models not found -- training now (first run, ~30 seconds)...
  python -m app.ml.train
  if %errorlevel% neq 0 (
    echo Error: Model training failed.
    pause & exit /b 1
  )
) else (
  echo   Models found -- skipping training.
)

if exist "%BACKEND_DIR%\oraph.db" (
  echo   Note: Database exists. Delete if schema changed.
)

REM ---- Start backend ----
echo [5/6] Starting backend on 0.0.0.0:%BACKEND_PORT%...
start "BudgetBeacon - Backend" /min cmd /c "uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"
set BACKEND_PID=!ERRORLEVEL!

echo   Waiting for backend...
set READY=0
for /l %%i in (1,1,30) do (
  >nul 2>&1 curl -s http://127.0.0.1:%BACKEND_PORT%/health && set READY=1 && goto :backend_ready
  >nul 2>&1 timeout /t 1
)
:backend_ready
if %READY% equ 0 (
  echo Error: Backend failed to start within 30 seconds.
  pause & exit /b 1
)
echo   Backend is ready!
echo   API Docs: http://127.0.0.1:%BACKEND_PORT%/docs
echo.

REM ---- Start frontend ----
if "%NO_FRONTEND%"=="0" (
  echo [6/6] Starting frontend on 0.0.0.0:%FRONTEND_PORT%...
  cd /d "%FRONTEND_DIR%"

  npm install --silent >nul 2>&1
  if %errorlevel% neq 0 (
    echo Warning: npm install had issues. Attempting to start anyway...
  )

  set VITE_API_URL=http://127.0.0.1:%BACKEND_PORT%
  start "BudgetBeacon - Frontend" /min cmd /c "npx vite --host 0.0.0.0 --port %FRONTEND_PORT%"

  echo   Frontend: http://127.0.0.1:%FRONTEND_PORT%
  echo.
)

REM ---- Summary ----
echo ==============================================
echo    BudgetBeacon is running!
echo.
echo    Frontend:  http://127.0.0.1:%FRONTEND_PORT%
echo    Backend:   http://127.0.0.1:%BACKEND_PORT%
echo    API Docs:  http://127.0.0.1:%BACKEND_PORT%/docs
echo.
echo    Close this window to stop all services.
echo ==============================================

pause
