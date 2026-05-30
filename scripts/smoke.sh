#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG=/tmp/rhflow-smoke.log

cd "$ROOT_DIR"

echo "Seeding database..." | tee "$LOG"
npm run seed 2>&1 | tee -a "$LOG"

if command -v lsof >/dev/null 2>&1; then
  PORT_PIDS=$(lsof -ti tcp:3000 || true)
elif command -v fuser >/dev/null 2>&1; then
  PORT_PIDS=$(fuser -n tcp 3000 2>/dev/null || true)
else
  PORT_PIDS=""
fi

if [ -n "$PORT_PIDS" ]; then
  echo "Porta 3000 já está em uso; finalizando processos existentes..." | tee -a "$LOG"
  echo "$PORT_PIDS" | tr ' ' '\n' | xargs -r kill || true
  sleep 1
fi

echo "Starting server in background..." | tee -a "$LOG"
# start server and capture output
node backend/server.js 2>&1 | tee -a "$LOG" &
SERVER_PID=$!
STARTED_SERVER=true
trap 'if [ "${STARTED_SERVER:-false}" = true ]; then kill "$SERVER_PID" >/dev/null 2>&1 || true; fi' EXIT
sleep 2

echo "Running checks..." | tee -a "$LOG"
# health
curl -sS -f http://127.0.0.1:3000/health | tee -a "$LOG"
# static
curl -sS -f -I http://127.0.0.1:3000/index.html | head -n 1 | tee -a "$LOG"
curl -sS -f -I http://127.0.0.1:3000/vagas.html | head -n 1 | tee -a "$LOG"
# api public
curl -sS -f http://127.0.0.1:3000/api/vacancies/public | tee -a "$LOG"
# login
LOGIN_RESPONSE=$(curl -sS -f -X POST http://127.0.0.1:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@rhflow.com","password":"123456"}')
echo "Login response: $LOGIN_RESPONSE" | tee -a "$LOG"
# create candidate
CREATED_CANDIDATE=$(curl -sS -f -X POST http://127.0.0.1:3000/api/candidates -H "Content-Type: application/json" -d '{"name":"Smoke Tester","email":"smoke+tester@example.com","phone":"11900000000","vacancy":"ux","portfolio":"","summary":"smoke"}')
echo "Created candidate: $CREATED_CANDIDATE" | tee -a "$LOG"

echo "Smoke test completed; stopping server PID $SERVER_PID" | tee -a "$LOG"
kill "$SERVER_PID" >/dev/null 2>&1 || true
STARTED_SERVER=false

echo "Log saved to $LOG"
exit 0
