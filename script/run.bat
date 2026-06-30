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

cd /d "%BACKEND_DIR%"

echo [1/4] Setting up Python virtual environment...
if not exist "venv" (python -m venv venv)
if errorlevel 1 (echo Error: venv creation failed & pause & exit /b 1)

call venv\Scripts\activate.bat
if errorlevel 1 (echo Error: venv activation failed & pause & exit /b 1)

echo [2/4] Installing Python dependencies...
pip install -r requirements.txt -q
if errorlevel 1 (echo Error: pip install failed & pause & exit /b 1)

echo [3/4] Checking ML models...
if not exist "%MODEL_DIR%\main_model.pkl" (
  echo   Models not found -- training now (first run, ~30 seconds)
  python -m app.ml.train
  if errorlevel 1 (echo Error: training failed & pause & exit /b 1)
) else (
  echo   Models found -- skipping training.
)

echo [4/4] Starting backend on 0.0.0.0:%BACKEND_PORT%...
start "BudgetBeacon - Backend" /min cmd /c "uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"
echo   Waiting for backend...
set READY=0
for /l %%i in (1,1,30) do (
  >nul 2>&1 curl -s http://127.0.0.1:%BACKEND_PORT%/health && set READY=1 && goto :backend_ready
  >nul 2>&1 timeout /t 1
)
:backend_ready
if %READY% equ 0 (
  echo   Warning: Backend health check failed, may still be starting.
) else (
  echo   Backend is ready!
)
echo   API Docs: http://127.0.0.1:%BACKEND_PORT%/docs
echo.

if "%NO_FRONTEND%"=="1" goto :summary

echo [5/5] Starting frontend on 0.0.0.0:%FRONTEND_PORT%...
cd /d "%FRONTEND_DIR%"
npm install --silent >nul 2>&1
if errorlevel 1 (
  echo   Warning: npm install had issues, attempting to start anyway...
)
set VITE_API_URL=http://127.0.0.1:%BACKEND_PORT%
start "BudgetBeacon - Frontend" /min cmd /c "npx vite --host 0.0.0.0 --port %FRONTEND_PORT%"
echo   Frontend: http://127.0.0.1:%FRONTEND_PORT%

:summary
echo ==============================================
echo    BudgetBeacon is running!
echo.
echo    Frontend:  http://127.0.0.1:%FRONTEND_PORT%
echo    Backend:   http://127.0.0.1:%BACKEND_PORT%
echo    API Docs:  http://127.0.0.1:%BACKEND_PORT%/docs
echo.
echo    Opening frontend in your browser...
echo    Close this window to stop all services.
echo ==============================================
start http://127.0.0.1:%FRONTEND_PORT%
pause
