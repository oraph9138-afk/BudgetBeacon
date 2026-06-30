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
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "╔══════════════════════════════════════════════════╗"
echo "║         BudgetBeacon — Starting Up              ║"
echo "╚══════════════════════════════════════════════════╝"
echo " Root:      $ROOT_DIR"
echo " Backend:   0.0.0.0:$BACKEND_PORT"
echo " Frontend:  0.0.0.0:$FRONTEND_PORT"
echo ""

# ──────────────────────────────────────────────
# 1. Backend setup
# ──────────────────────────────────────────────
echo "▸ Backend: installing Python dependencies..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

# Detect Debian/Ubuntu for --break-system-packages
if grep -qi "debian\|ubuntu" /etc/os-release 2>/dev/null; then
  pip install --break-system-packages -r requirements.txt -q
else
  pip install -r requirements.txt -q
fi

# ──────────────────────────────────────────────
# 2. Train ML model (if needed)
# ──────────────────────────────────────────────
MODEL_DIR="$BACKEND_DIR/models"
if [ ! -f "$MODEL_DIR/main_model.pkl" ] || [ ! -f "$MODEL_DIR/lower_model.pkl" ] || [ ! -f "$MODEL_DIR/upper_model.pkl" ]; then
  echo "▸ ML models not found — training now (first run)..."
  python -m app.ml.train
else
  echo "▸ ML models already trained — skipping."
fi

# ──────────────────────────────────────────────
# 3. Clean old DB (remove if schema changed)
# ──────────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/oraph.db" ]; then
  echo "▸ No database found — will be created on first request."
fi

# ──────────────────────────────────────────────
# 4. Start backend
# ──────────────────────────────────────────────
echo "▸ Starting backend on 0.0.0.0:$BACKEND_PORT..."
uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo -n "   Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1; then
    echo " ready!"
    break
  fi
  sleep 1
done

echo "   API Docs:  http://127.0.0.1:$BACKEND_PORT/docs"
echo ""

# ──────────────────────────────────────────────
# 5. Start frontend (optional)
# ──────────────────────────────────────────────
if [ "$NO_FRONTEND" = false ]; then
  echo "▸ Frontend: installing npm dependencies..."
  cd "$FRONTEND_DIR"
  npm install --silent 2>/dev/null

  echo "▸ Starting frontend on 0.0.0.0:$FRONTEND_PORT..."
  VITE_API_URL="http://127.0.0.1:$BACKEND_PORT" npx vite --host 0.0.0.0 --port "$FRONTEND_PORT" &
  FRONTEND_PID=$!

  echo "   Frontend: http://127.0.0.1:$FRONTEND_PORT"
  echo ""
fi

# ──────────────────────────────────────────────
# 6. Summary
# ──────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════╗"
echo "║  BudgetBeacon is running!                       ║"
echo "║                                                  ║"
echo "║  Frontend:  http://127.0.0.1:$FRONTEND_PORT      ║"
echo "║  Backend:   http://127.0.0.1:$BACKEND_PORT      ║"
echo "║  API Docs:  http://127.0.0.1:$BACKEND_PORT/docs ║"
echo "║                                                  ║"
echo "║  Press Ctrl+C to stop all services               ║"
echo "╚══════════════════════════════════════════════════╝"

# ──────────────────────────────────────────────
# 7. Cleanup handler
# ──────────────────────────────────────────────
cleanup() {
  echo ""
  echo "▸ Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  echo "▸ Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for any background process to exit
wait
