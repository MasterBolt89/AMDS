#!/usr/bin/env bash
set -e

# =====================================================================
# 🚀 AMDS (Autonomous Medical Decision Support) - Unified Cross-Platform Launcher
# NASA Space Apps Challenge 2026 (macOS & Linux)
# Mirrors start-demo.bat
# =====================================================================

echo "====================================================================="
echo "   🚀 AMDS — Autonomous Medical Decision Support Launcher"
echo "   NASA Space Apps Challenge 2026"
echo "====================================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Clean termination of all spawned processes on exit or interrupt
cleanup() {
  echo ""
  echo "Shutting down servers..."
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "All servers stopped. Exiting."
}
trap cleanup EXIT INT TERM

echo "[1/3] Syncing dependencies and starting FastAPI Backend on http://127.0.0.1:8000 ..."
(cd "$BACKEND_DIR" && uv sync && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

echo "[2/3] Installing dependencies and starting Vite Frontend on http://127.0.0.1:5173 ..."
(cd "$FRONTEND_DIR" && npm install && npm run dev) &
FRONTEND_PID=$!

echo "[3/3] Waiting for servers to initialize..."
sleep 4

echo ""
echo "====================================================================="
echo "   🌟 Systems Online!"
echo "   Frontend:    http://127.0.0.1:5173"
echo "   Backend API: http://127.0.0.1:8000/docs"
echo "====================================================================="
echo "Opening Command Center in default browser..."

if command -v open >/dev/null 2>&1; then
  open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:5173"
fi

wait
