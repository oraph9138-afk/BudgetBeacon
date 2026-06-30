#!/usr/bin/env bash
#===============================================================================
# BudgetBeacon — One-Command Runner
# Linux / macOS
#===============================================================================
# Usage:
#   chmod +x run.sh && ./run.sh
#
# Flags:
#   --backend-port PORT    Backend port (default: 8000)
#   --frontend-port PORT   Frontend port (default: 5173)
#   --no-frontend          Start backend only
#===============================================================================

set -e

BACKEND_PORT=8000
FRONTEND_PORT=5173
NO_FRONTEND=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-port)  BACKEND_PORT="$2";  shift 2 ;;
    --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
    --no-frontend)   NO_FRONTEND=true;   shift   ;;
    -h|--help)
      echo "Usage: $0 [--backend-port PORT] [--frontend-port PORT] [--no-frontend]"
      exit 0 ;;
    *) echo "Error: Unknown flag '$1'. Use --help for usage."; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
MODEL_DIR="$BACKEND_DIR/models"

# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────
die() {
  echo "❌ Error: $1" >&2
  exit 1
}

check_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed."
}

# ──────────────────────────────────────────────
# Pre-flight checks
# ──────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════╗"
echo "║         BudgetBeacon — Starting Up              ║"
echo "╚══════════════════════════════════════════════════╝"
echo " Root:      $ROOT_DIR"
echo " Backend:   0.0.0.0:$BACKEND_PORT"
echo " Frontend:  0.0.0.0:$FRONTEND_PORT"
echo ""

# Check OS
OS="$(uname -s)"
case "$OS" in
  Linux|Darwin) ;;
  *) die "Unsupported OS: $OS. This script requires Linux or macOS." ;;
esac

# Check required tools
check_cmd python3
check_cmd pip3 || check_cmd pip || die "pip is required but not installed."
check_cmd curl
check_cmd node
check_cmd npm

# Python version check — must be 3.10–3.13
PY_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
PY_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
if [ "$PY_MAJOR" -ne 3 ] || [ "$PY_MINOR" -lt 10 ] || [ "$PY_MINOR" -gt 13 ]; then
  die "Python 3.10–3.13 required, got $PY_MAJOR.$PY_MINOR. Python 3.14+ is not supported by pydantic-core."
fi
echo "✔ Python $PY_MAJOR.$PY_MINOR"
echo "✔ Node $(node --version)"
echo "✔ npm $(npm --version)"
echo ""

# Check directories exist
[ -d "$BACKEND_DIR" ]   || die "Backend directory not found at $BACKEND_DIR"
[ -d "$FRONTEND_DIR" ]  || die "Frontend directory not found at $FRONTEND_DIR"
[ -f "$BACKEND_DIR/requirements.txt" ] || die "requirements.txt not found in $BACKEND_DIR"
[ -f "$FRONTEND_DIR/package.json" ]    || die "package.json not found in $FRONTEND_DIR"

# Check port availability
check_port() {
  local port=$1 name=$2
  if command -v ss >/dev/null 2>&1; then
    if ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port"; then
      die "Port $port ($name) is already in use. Use --backend-port or --frontend-port to change it."
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
      die "Port $port ($name) is already in use. Use --backend-port or --frontend-port to change it."
    fi
  fi
}
check_port "$BACKEND_PORT" "backend"
check_port "$FRONTEND_PORT" "frontend"

# ──────────────────────────────────────────────
# 1. Backend setup — venv + dependencies
# ──────────────────────────────────────────────
echo "▸ Backend: setting up Python virtual environment..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  python3 -m venv venv || die "Failed to create virtual environment."
fi
source venv/bin/activate || die "Failed to activate virtual environment."

echo "▸ Backend: installing Python dependencies..."
if grep -qi "debian\|ubuntu" /etc/os-release 2>/dev/null; then
  pip install --break-system-packages -r requirements.txt -q || die "pip install failed. Try: pip install --break-system-packages -r requirements.txt"
else
  pip install -r requirements.txt -q || die "pip install failed. Check requirements.txt and your internet connection."
fi

# ──────────────────────────────────────────────
# 2. Train ML model (if needed)
# ──────────────────────────────────────────────
if [ ! -f "$MODEL_DIR/main_model.pkl" ] || [ ! -f "$MODEL_DIR/lower_model.pkl" ] || [ ! -f "$MODEL_DIR/upper_model.pkl" ]; then
  echo "▸ ML models not found — training now (first run, ~30 seconds)..."
  python -m app.ml.train || die "Model training failed. Check app/ml/train.py for errors."
else
  echo "▸ ML models found — skipping training."
fi

# Warn about old database if schema may have changed
if [ -f "$BACKEND_DIR/oraph.db" ]; then
  echo "⚠  Database exists at backend/oraph.db. If you changed the schema, delete it and restart."
fi

# ──────────────────────────────────────────────
# 3. Start backend
# ──────────────────────────────────────────────
echo "▸ Starting backend on 0.0.0.0:$BACKEND_PORT..."
uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

echo -n "   Waiting for backend..."
BACKEND_READY=false
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1; then
    BACKEND_READY=true
    echo " ready!"
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" = false ]; then
  echo " failed."
  kill "$BACKEND_PID" 2>/dev/null
  die "Backend failed to start within 30 seconds. Check for errors above."
fi

echo "   API Docs:  http://localhost:$BACKEND_PORT/docs"
echo ""

# ──────────────────────────────────────────────
# 4. Start frontend (optional)
# ──────────────────────────────────────────────
if [ "$NO_FRONTEND" = false ]; then
  echo "▸ Frontend: installing npm dependencies..."
  cd "$FRONTEND_DIR"
  npm install --silent 2>/dev/null || die "npm install failed. Try: cd frontend && npm install"

  echo "▸ Starting frontend on 0.0.0.0:$FRONTEND_PORT..."
  VITE_API_URL="http://127.0.0.1:$BACKEND_PORT" npx vite --host 0.0.0.0 --port "$FRONTEND_PORT" &
  FRONTEND_PID=$!

  sleep 3
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "   Frontend: http://localhost:$FRONTEND_PORT"
  else
    echo "⚠  Frontend process exited unexpectedly. Check npm run dev for errors."
  fi
  echo ""
fi

# ──────────────────────────────────────────────
# 5. Summary
# ──────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════╗"
echo "║  BudgetBeacon is running!                       ║"
echo "║                                                  ║"
echo "║  Frontend:  http://localhost:$FRONTEND_PORT      ║"
echo "║  Backend:   http://localhost:$BACKEND_PORT      ║"
echo "║  API Docs:  http://localhost:$BACKEND_PORT/docs ║"
echo "║                                                  ║"
echo "║  Press Ctrl+C to stop all services               ║"
echo "╚══════════════════════════════════════════════════╝"

# ──────────────────────────────────────────────
# 6. Cleanup handler
# ──────────────────────────────────────────────
cleanup() {
  echo ""
  echo "▸ Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null && echo "   Backend stopped." || echo "   Backend already stopped."
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo "   Frontend stopped." || true
  echo "▸ Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for any background process to exit
wait
