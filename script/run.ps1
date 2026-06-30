<#
.SYNOPSIS
  BudgetBeacon — One-Command Runner (Windows PowerShell)
.DESCRIPTION
  Starts backend (FastAPI) and frontend (Vite) servers.
  Run from PowerShell: .\run.ps1
  If double-clicking opens Notepad, run from a terminal instead.
.PARAMETER BackendPort
  Port for the backend API server (default: 8000)
.PARAMETER FrontendPort
  Port for the frontend dev server (default: 5173)
.PARAMETER NoFrontend
  Skip starting the frontend
.EXAMPLE
  .\run.ps1
  .\run.ps1 -BackendPort 8080 -FrontendPort 3000
  .\run.ps1 -NoFrontend
#>

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

function Die {
  param([string]$Message)
  Write-Host "`n`n❌ Error: $Message" -ForegroundColor Red
  Write-Host "`nPress any key to exit..."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
  exit 1
}

function Check-Command {
  param([string]$Command, [string]$Name)
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    Die "$Name is required but not installed or not in PATH."
  }
}

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         BudgetBeacon — Starting Up              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host " Root:      $RootDir"
Write-Host " Backend:   0.0.0.0:$BackendPort"
Write-Host " Frontend:  0.0.0.0:$FrontendPort"
Write-Host ""

if ($PSVersionTable.PSVersion.Major -lt 5) {
  Die "PowerShell 5.0+ is required (you have $($PSVersionTable.PSVersion))."
}

Check-Command "python" "Python 3.10–3.13"
Check-Command "node"   "Node.js 20+"
Check-Command "npm"    "npm 9+"

try {
  $pyMajor = & python -c "import sys; print(sys.version_info.major)"
  $pyMinor = & python -c "import sys; print(sys.version_info.minor)"
  $major = [int]$pyMajor.Trim(); $minor = [int]$pyMinor.Trim()
  Write-Host "✔ Python $major.$minor"
  if ($major -ne 3 -or $minor -lt 10 -or $minor -gt 13) {
    Die "Python 3.10–3.13 required, got $major.$minor. Python 3.14+ breaks pydantic-core."
  }
} catch { Die "Failed to detect Python version." }

try { Write-Host "✔ $(& node --version)"; Write-Host "✔ $(& npm --version)" }
catch { Die "Node.js or npm not found." }
Write-Host ""

if (-not (Test-Path $BackendDir))  { Die "Backend directory not found: $BackendDir" }
if (-not (Test-Path $FrontendDir)) { Die "Frontend directory not found: $FrontendDir" }
if (-not (Test-Path $ReqFile))     { Die "Missing: $ReqFile" }
if (-not (Test-Path $PkgFile))     { Die "Missing: $PkgFile" }

try {
  $listeners = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
  if ($listeners | Where-Object { $_.Port -eq $BackendPort })  { Die "Port $BackendPort (backend) in use. Use -BackendPort." }
  if ($listeners | Where-Object { $_.Port -eq $FrontendPort }) { Die "Port $FrontendPort (frontend) in use. Use -FrontendPort." }
} catch { Write-Host "⚠  Port check skipped (admin rights may help)." -ForegroundColor Yellow }

Write-Host "▸ Backend: setting up Python virtual environment..."
Set-Location $BackendDir
if (-not (Test-Path "venv")) {
  python -m venv venv | Out-Null
  if (-not (Test-Path "venv")) { Die "Failed to create virtual environment." }
}
$venvActivate = Join-Path $BackendDir "venv" "Scripts" "Activate.ps1"
if (-not (Test-Path $venvActivate)) { Die "Activation script not found: $venvActivate" }
. $venvActivate

Write-Host "▸ Backend: installing Python dependencies..."
try {
  $p = Start-Process -FilePath "pip" -ArgumentList "install -r requirements.txt -q" -NoNewWindow -Wait -PassThru
  if ($p.ExitCode -ne 0) { throw "pip exited with code $($p.ExitCode)" }
} catch { Die "pip install failed. Check your internet connection." }

$mainModel  = Join-Path $ModelDir "main_model.pkl"
$lowerModel = Join-Path $ModelDir "lower_model.pkl"
$upperModel = Join-Path $ModelDir "upper_model.pkl"
$needTrain = (-not (Test-Path $mainModel)) -or (-not (Test-Path $lowerModel)) -or (-not (Test-Path $upperModel))

if ($needTrain) {
  Write-Host "▸ ML models not found — training now (first run, ~30 seconds)..."
  try {
    $p = Start-Process -FilePath "python" -ArgumentList "-m app.ml.train" -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw "training exited with code $($p.ExitCode)" }
  } catch { Die "Model training failed. Run 'python -m app.ml.train' manually." }
} else { Write-Host "▸ ML models found — skipping training." }

$dbFile = Join-Path $BackendDir "oraph.db"
if (Test-Path $dbFile) {
  Write-Host "⚠  Database exists at backend\oraph.db. Delete it if schema changed." -ForegroundColor Yellow
}

Write-Host "▸ Starting backend on 0.0.0.0:$BackendPort..."
$backendJob = Start-Job -Name "BudgetBeacon-Backend" -ScriptBlock {
  param($Dir, $Port)
  Set-Location $Dir
  . (Join-Path $Dir "venv" "Scripts" "Activate.ps1")
  uvicorn app.main:app --host 0.0.0.0 --port $Port --reload
} -ArgumentList $BackendDir, $BackendPort

Write-Host -NoNewLine "   Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/health" -UseBasicParsing -TimeoutSec 2; $ready = $true; break }
  catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) {
  Write-Host " failed." -ForegroundColor Red
  Receive-Job $backendJob
  Stop-Job $backendJob; Remove-Job $backendJob
  Die "Backend failed to start within 30 seconds."
}
Write-Host " ready!" -ForegroundColor Green
Write-Host "   API Docs:  http://127.0.0.1:$BackendPort/docs"
Write-Host ""

$frontendJob = $null
if (-not $NoFrontend) {
  Write-Host "▸ Frontend: installing npm dependencies..."
  Set-Location $FrontendDir
  try {
    $p = Start-Process -FilePath "npm" -ArgumentList "install --silent" -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw "npm install failed" }
  } catch { Die "npm install failed. Try 'cd frontend && npm install' manually." }

  Write-Host "▸ Starting frontend on 0.0.0.0:$FrontendPort..."
  $env:VITE_API_URL = "http://127.0.0.1:$BackendPort"
  $frontendJob = Start-Job -Name "BudgetBeacon-Frontend" -ScriptBlock {
    param($Dir, $Port)
    Set-Location $Dir
    $env:BROWSER = "none"
    npx vite --host 0.0.0.0 --port $Port
  } -ArgumentList $FrontendDir, $FrontendPort

  Start-Sleep -Seconds 4
  if ($frontendJob.State -eq "Running") {
    Write-Host "   Frontend: http://127.0.0.1:$FrontendPort"
  } else {
    Write-Host "⚠  Frontend failed to start." -ForegroundColor Yellow
    Receive-Job $frontendJob -ErrorAction SilentlyContinue
  }
  Write-Host ""
}

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
Write-Host "If the window closes unexpectedly, run from a terminal: powershell -ExecutionPolicy Bypass -File .\run.ps1" -ForegroundColor Gray

try {
  while ($true) {
    Start-Sleep -Seconds 5
    $failed = @()
    if ($backendJob.State -eq "Failed")  { $failed += "Backend" }
    if ($frontendJob -and $frontendJob.State -eq "Failed") { $failed += "Frontend" }
    if ($failed.Count -gt 0) {
      Write-Host "⚠  $($failed -join ', ') stopped unexpectedly!" -ForegroundColor Red
      if ($backendJob.State -eq "Failed") { Receive-Job $backendJob }
      break
    }
  }
}
finally {
  Write-Host "`n▸ Shutting down..."
  if ($backendJob)  { Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue; Write-Host "   Backend stopped." }
  if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue; Write-Host "   Frontend stopped." }
  Write-Host "▸ Done."
  Write-Host "Press any key to exit..."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
