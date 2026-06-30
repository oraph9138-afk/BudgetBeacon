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

$ErrorActionPreference = "Stop"

$RootDir     = Join-Path $PSScriptRoot ".."
$BackendDir  = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$ModelDir    = Join-Path $BackendDir "models"
$ReqFile     = Join-Path $BackendDir "requirements.txt"
$PkgFile     = Join-Path $FrontendDir "package.json"

# ──────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────
function Die {
  param([string]$Message)
  Write-Host "`n❌ Error: $Message" -ForegroundColor Red
  exit 1
}

function Check-Command {
  param([string]$Command, [string]$Name)
  $found = Get-Command $Command -ErrorAction SilentlyContinue
  if (-not $found) {
    Die "$Name is required but not installed or not in PATH."
  }
}

# ──────────────────────────────────────────────
# Pre-flight checks
# ──────────────────────────────────────────────
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         BudgetBeacon — Starting Up              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host " Root:      $RootDir"
Write-Host " Backend:   0.0.0.0:$BackendPort"
Write-Host " Frontend:  0.0.0.0:$FrontendPort"
Write-Host ""

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
  Die "PowerShell 5.0 or later is required. You have $($PSVersionTable.PSVersion)."
}

# Check required tools
Check-Command -Command "python"   -Name "Python 3.10–3.13"
Check-Command -Command "node"     -Name "Node.js 20+"
Check-Command -Command "npm"      -Name "npm 9+"

# Python version check — must be 3.10–3.13
try {
  $pyVer = & python --version 2>&1
  Write-Host "✔ $pyVer"
  if ($pyVer -match "Python (\d+)\.(\d+)") {
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -ne 3 -or $minor -lt 10 -or $minor -gt 13) {
      Die "Python 3.10–3.13 required, got $major.$minor. Python 3.14 is not supported by pydantic-core."
    }
  }
} catch {
  Die "Failed to detect Python version. Ensure Python is installed and in PATH."
}

try {
  Write-Host "✔ $(& node --version)"
  Write-Host "✔ $(& npm --version)"
} catch {
  Die "Node.js or npm not found."
}

Write-Host ""

# Check directories and files exist
if (-not (Test-Path $BackendDir))  { Die "Backend directory not found at $BackendDir" }
if (-not (Test-Path $FrontendDir)) { Die "Frontend directory not found at $FrontendDir" }
if (-not (Test-Path $ReqFile))     { Die "requirements.txt not found at $ReqFile" }
if (-not (Test-Path $PkgFile))     { Die "package.json not found at $PkgFile" }

# Check port availability
try {
  $tcp = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
  $activeListeners = $tcp.GetActiveTcpListeners()
  $backendInUse = $activeListeners | Where-Object { $_.Port -eq $BackendPort }
  $frontendInUse = $activeListeners | Where-Object { $_.Port -eq $FrontendPort }
  if ($backendInUse)  { Die "Port $BackendPort (backend) is already in use. Use -BackendPort to change it." }
  if ($frontendInUse) { Die "Port $FrontendPort (frontend) is already in use. Use -FrontendPort to change it." }
} catch {
  Write-Host "⚠  Could not check port availability (administrator rights may be needed)." -ForegroundColor Yellow
}

# Windows version note
$osInfo = Get-WmiObject Win32_OperatingSystem -ErrorAction SilentlyContinue
if ($osInfo) {
  Write-Host "✔ Windows $($osInfo.Caption) $($osInfo.OSArchitecture)"
} else {
  Write-Host "✔ Windows (unknown version)"
}

# ──────────────────────────────────────────────
# 1. Backend setup — venv + dependencies
# ──────────────────────────────────────────────
Write-Host "▸ Backend: setting up Python virtual environment..."
Set-Location $BackendDir

if (-not (Test-Path "venv")) {
  python -m venv venv | Out-Null
  if (-not (Test-Path "venv")) { Die "Failed to create virtual environment." }
}
$venvActivate = Join-Path $BackendDir "venv" "Scripts" "Activate.ps1"
if (-not (Test-Path $venvActivate)) { Die "Virtual environment activation script not found at $venvActivate" }
. $venvActivate

Write-Host "▸ Backend: installing Python dependencies..."
try {
  pip install -r requirements.txt -q
  if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
} catch {
  Die "pip install failed. Check requirements.txt and your internet connection. Error: $_"
}

# ──────────────────────────────────────────────
# 2. Train ML model (if needed)
# ──────────────────────────────────────────────
$mainModel  = Join-Path $ModelDir "main_model.pkl"
$lowerModel = Join-Path $ModelDir "lower_model.pkl"
$upperModel = Join-Path $ModelDir "upper_model.pkl"

$needTrain = (-not (Test-Path $mainModel)) -or (-not (Test-Path $lowerModel)) -or (-not (Test-Path $upperModel))

if ($needTrain) {
  Write-Host "▸ ML models not found — training now (first run, ~30 seconds)..."
  try {
    python -m app.ml.train
    if ($LASTEXITCODE -ne 0) { throw "Training exited with code $LASTEXITCODE" }
  } catch {
    Die "Model training failed. Run 'python -m app.ml.train' manually to see details."
  }
} else {
  Write-Host "▸ ML models found — skipping training."
}

# Warn about old database if schema may have changed
$dbFile = Join-Path $BackendDir "oraph.db"
if (Test-Path $dbFile) {
  Write-Host "⚠  Database exists at backend\oraph.db. If you changed the schema, delete it and restart." -ForegroundColor Yellow
}

# ──────────────────────────────────────────────
# 3. Start backend
# ──────────────────────────────────────────────
Write-Host "▸ Starting backend on 0.0.0.0:$BackendPort..."
$backendJob = Start-Job -Name "BudgetBeacon-Backend" -ScriptBlock {
  param($Dir, $Port)
  Set-Location $Dir
  $act = Join-Path $Dir "venv" "Scripts" "Activate.ps1"
  . $act
  uvicorn app.main:app --host 0.0.0.0 --port $Port --reload
  if ($LASTEXITCODE -ne 0) { throw "uvicorn exited with code $LASTEXITCODE" }
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

if (-not $backendReady) {
  Write-Host " failed." -ForegroundColor Red
  Write-Host "   Checking job output:" -ForegroundColor Yellow
  Receive-Job $backendJob -ErrorAction SilentlyContinue
  Stop-Job $backendJob -ErrorAction SilentlyContinue
  Remove-Job $backendJob -ErrorAction SilentlyContinue
  Die "Backend failed to start within 30 seconds."
}
Write-Host " ready!" -ForegroundColor Green
Write-Host "   API Docs:  http://127.0.0.1:$BackendPort/docs"
Write-Host ""

# ──────────────────────────────────────────────
# 4. Start frontend (optional)
# ──────────────────────────────────────────────
$frontendJob = $null
if (-not $NoFrontend) {
  Write-Host "▸ Frontend: installing npm dependencies..."
  Set-Location $FrontendDir
  try {
    $null = npm install --silent 2>&1
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
  } catch {
    Die "npm install failed. Try running 'cd frontend && npm install' manually."
  }

  Write-Host "▸ Starting frontend on 0.0.0.0:$FrontendPort..."
  $env:VITE_API_URL = "http://127.0.0.1:$BackendPort"
  $frontendJob = Start-Job -Name "BudgetBeacon-Frontend" -ScriptBlock {
    param($Dir, $Port)
    Set-Location $Dir
    $env:BROWSER = "none"
    npx vite --host 0.0.0.0 --port $Port
    if ($LASTEXITCODE -ne 0) { throw "vite exited with code $LASTEXITCODE" }
  } -ArgumentList $FrontendDir, $FrontendPort

  Start-Sleep -Seconds 4
  if ($frontendJob.State -eq "Running") {
    Write-Host "   Frontend: http://127.0.0.1:$FrontendPort"
  } else {
    Write-Host "⚠  Frontend process exited unexpectedly. Job state: $($frontendJob.State)" -ForegroundColor Yellow
    Receive-Job $frontendJob -ErrorAction SilentlyContinue
  }
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
Write-Host ""

# ──────────────────────────────────────────────
# 6. Monitor jobs + cleanup
# ──────────────────────────────────────────────
try {
  while ($true) {
    Start-Sleep -Seconds 5
    $failed = @()
    if ($backendJob.State -eq "Failed") { $failed += "Backend" }
    if ($frontendJob -and $frontendJob.State -eq "Failed") { $failed += "Frontend" }
    if ($failed.Count -gt 0) {
      Write-Host "⚠  $($failed -join ', ') process stopped unexpectedly!" -ForegroundColor Red
      if ($backendJob.State -eq "Failed") {
        Write-Host "   Backend output:" -ForegroundColor Yellow
        Receive-Job $backendJob
      }
      break
    }
  }
}
finally {
  Write-Host ""
  Write-Host "▸ Shutting down..."
  if ($backendJob) {
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "   Backend stopped."
  }
  if ($frontendJob) {
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "   Frontend stopped."
  }
  Write-Host "▸ Done."
}
