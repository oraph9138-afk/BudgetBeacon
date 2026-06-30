#===============================================================================
# BudgetBeacon — One-Command Runner
# Windows (PowerShell 5.1+ / PowerShell Core)
#===============================================================================
# Usage:
#   .\run.ps1
#
# Flags:
#   -BackendPort PORT    Backend port (default: 8000)
#   -FrontendPort PORT   Frontend port (default: 5173)
#   -NoFrontend          Start backend only
#===============================================================================

param(
  [int]    $BackendPort  = 8000,
  [int]    $FrontendPort = 5173,
  [switch] $NoFrontend
)

$RootDir     = Join-Path $PSScriptRoot ".."
$BackendDir  = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$ModelDir    = Join-Path $BackendDir "models"

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         BudgetBeacon — Starting Up              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host " Root:      $RootDir"
Write-Host " Backend:   0.0.0.0:$BackendPort"
Write-Host " Frontend:  0.0.0.0:$FrontendPort"
Write-Host ""

# ──────────────────────────────────────────────
# 1. Backend setup
# ──────────────────────────────────────────────
Write-Host "▸ Backend: installing Python dependencies..."
Set-Location $BackendDir

if (-not (Test-Path "venv")) {
  python -m venv venv
}
$venvActivate = Join-Path $BackendDir "venv" "Scripts" "Activate.ps1"
. $venvActivate

pip install -r requirements.txt -q

# ──────────────────────────────────────────────
# 2. Train ML model (if needed)
# ──────────────────────────────────────────────
$mainModel  = Join-Path $ModelDir "main_model.pkl"
$lowerModel = Join-Path $ModelDir "lower_model.pkl"
$upperModel = Join-Path $ModelDir "upper_model.pkl"

if (-not (Test-Path $mainModel) -or -not (Test-Path $lowerModel) -or -not (Test-Path $upperModel)) {
  Write-Host "▸ ML models not found — training now (first run)..."
  python -m app.ml.train
} else {
  Write-Host "▸ ML models already trained — skipping."
}

# ──────────────────────────────────────────────
# 3. Start backend
# ──────────────────────────────────────────────
Write-Host "▸ Starting backend on 0.0.0.0:$BackendPort..."
$backendJob = Start-Job -ScriptBlock {
  param($Dir, $Port)
  Set-Location $Dir
  $act = Join-Path $Dir "venv" "Scripts" "Activate.ps1"
  . $act
  uvicorn app.main:app --host 0.0.0.0 --port $Port --reload
} -ArgumentList $BackendDir, $BackendPort

Write-Host -NoNewline "   Waiting for backend..."
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/health" -UseBasicParsing -TimeoutSec 2
    $backendReady = $true
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}
if ($backendReady) {
  Write-Host " ready!" -ForegroundColor Green
} else {
  Write-Host " TIMEOUT" -ForegroundColor Yellow
}
Write-Host "   API Docs:  http://127.0.0.1:$BackendPort/docs"
Write-Host ""

# ──────────────────────────────────────────────
# 4. Start frontend (optional)
# ──────────────────────────────────────────────
$frontendJob = $null
if (-not $NoFrontend) {
  Write-Host "▸ Frontend: installing npm dependencies..."
  Set-Location $FrontendDir
  npm install --silent 2>$null

  Write-Host "▸ Starting frontend on 0.0.0.0:$FrontendPort..."
  $env:VITE_API_URL = "http://127.0.0.1:$BackendPort"
  $frontendJob = Start-Job -ScriptBlock {
    param($Dir, $Port)
    Set-Location $Dir
    $env:BROWSER = "none"
    npx vite --host 0.0.0.0 --port $Port
  } -ArgumentList $FrontendDir, $FrontendPort

  Write-Host "   Frontend: http://127.0.0.1:$FrontendPort"
  Write-Host ""
}

# ──────────────────────────────────────────────
# 5. Summary
# ──────────────────────────────────────────────
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  BudgetBeacon is running!                       ║" -ForegroundColor Green
Write-Host "║                                                  ║" -ForegroundColor Green
Write-Host "║  Frontend:  http://127.0.0.1:$FrontendPort      ║" -ForegroundColor Green
Write-Host "║  Backend:   http://127.0.0.1:$BackendPort      ║" -ForegroundColor Green
Write-Host "║  API Docs:  http://127.0.0.1:$BackendPort/docs ║" -ForegroundColor Green
Write-Host "║                                                  ║" -ForegroundColor Green
Write-Host "║  Press Ctrl+C to stop all services               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green

# ──────────────────────────────────────────────
# 6. Wait for Ctrl+C and cleanup
# ──────────────────────────────────────────────
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Gray

try {
  while ($true) {
    Start-Sleep -Seconds 10
    # Check if jobs are still running
    if ($backendJob.State -eq "Failed") {
      Write-Host "Backend process stopped unexpectedly!" -ForegroundColor Red
      Receive-Job $backendJob
      break
    }
  }
}
finally {
  Write-Host ""
  Write-Host "▸ Shutting down..."
  if ($backendJob)  { Stop-Job  $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue }
  if ($frontendJob) { Stop-Job  $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
  Write-Host "▸ Done."
}
