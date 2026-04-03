#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()

ensure_node_dependencies() {
  local dir="$1"

  if [ -d "$ROOT_DIR/$dir/node_modules" ]; then
    return
  fi

  echo "Installing Node dependencies for $dir"
  (
    cd "$ROOT_DIR/$dir"
    npm install
  )
}

ensure_python_venv() {
  local dir="$1"

  if [ -d "$ROOT_DIR/$dir/.venv" ]; then
    return
  fi

  echo "Missing Python virtual environment in $dir/.venv"
  echo "Create it first with:"
  echo "  cd $dir && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  return 1
}

start_service() {
  local name="$1"
  local dir="$2"
  local cmd="$3"

  (
    cd "$ROOT_DIR/$dir"
    echo "[$name] starting in $dir"
    exec bash -lc "$cmd"
  ) &

  local pid=$!
  PIDS+=("$pid")
  echo "[$name] pid=$pid"
}

kill_process_tree() {
  local pid="$1"
  local signal="${2:-TERM}"
  local child

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  while IFS= read -r child; do
    if [ -n "$child" ]; then
      kill_process_tree "$child" "$signal"
    fi
  done < <(pgrep -P "$pid" || true)

  kill "-$signal" "$pid" 2>/dev/null || true
}

cleanup() {
  local exit_code=$?
  local pid

  trap - EXIT INT TERM

  if ((${#PIDS[@]} > 0)); then
    echo
    echo "Stopping all services..."
    for pid in "${PIDS[@]}"; do
      kill_process_tree "$pid" TERM
    done
    sleep 1
    for pid in "${PIDS[@]}"; do
      kill_process_tree "$pid" KILL
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi

  exit "$exit_code"
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local timeout_seconds="${3:-60}"
  local elapsed=0

  echo "Waiting for $name at $url"

  until curl --silent --fail "$url" >/dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if ((elapsed >= timeout_seconds)); then
      echo "Timed out waiting for $name at $url"
      return 1
    fi
  done

  echo "$name is ready"
}

wait_for_port() {
  local name="$1"
  local host="$2"
  local port="$3"
  local timeout_seconds="${4:-60}"
  local elapsed=0

  echo "Waiting for $name on $host:$port"

  until nc -z "$host" "$port" >/dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if ((elapsed >= timeout_seconds)); then
      echo "Timed out waiting for $name on $host:$port"
      return 1
    fi
  done

  echo "$name is ready"
}

assert_port_free() {
  local name="$1"
  local port="$2"
  local listeners

  listeners="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$listeners" ]; then
    return
  fi

  echo "Cannot start $name: port $port is already in use."
  echo "$listeners"
  echo
  echo "Stop the existing process and run ./scripts/dev-all.sh again."
  exit 1
}

trap cleanup EXIT INT TERM

LOCAL_USER_SERVICE_URL="http://localhost:4001"
LOCAL_QUESTION_SERVICE_URL="http://localhost:8000"
LOCAL_MATCHING_SERVICE_URL="http://localhost:8080"
LOCAL_COLLAB_SERVICE_URL="http://localhost:1234"
LOCAL_AI_ASSISTANT_SERVICE_URL="http://localhost:4002"
LOCAL_FRONTEND_ORIGIN="http://localhost:3000"
LOCAL_COLLAB_WS_URL="ws://localhost:1234"

ensure_python_venv "question-service"
ensure_node_dependencies "collaboration-service"
ensure_node_dependencies "user-service"
ensure_node_dependencies "ai-assistant-service"
ensure_node_dependencies "frontend"

assert_port_free "question-service" "8000"
assert_port_free "collaboration-service" "1234"
assert_port_free "user-service" "4001"
assert_port_free "ai-assistant-service" "4002"
assert_port_free "matching-service" "8080"
assert_port_free "frontend" "3000"

start_service "question-service" "question-service" "source .venv/bin/activate && python main.py"
wait_for_http "question-service" "$LOCAL_QUESTION_SERVICE_URL/health"

start_service "collaboration-service" "collaboration-service" "npm run dev"
wait_for_http "collaboration-service" "$LOCAL_COLLAB_SERVICE_URL/health"

start_service "user-service" "user-service" "export FRONTEND_ORIGIN='$LOCAL_FRONTEND_ORIGIN'; npm run dev"
wait_for_http "user-service" "$LOCAL_USER_SERVICE_URL/health"

start_service "ai-assistant-service" "ai-assistant-service" "export FRONTEND_ORIGIN='$LOCAL_FRONTEND_ORIGIN'; npm run dev"
wait_for_http "ai-assistant-service" "$LOCAL_AI_ASSISTANT_SERVICE_URL/health"

start_service "matching-service" "matching-service" "export QUESTION_SERVICE_URL='$LOCAL_QUESTION_SERVICE_URL'; export COLLABORATION_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; ./gradlew bootRun"
wait_for_port "matching-service" "localhost" "8080"

start_service "frontend" "frontend" "export USER_SERVICE_URL='$LOCAL_USER_SERVICE_URL'; export QUESTION_SERVICE_URL='$LOCAL_QUESTION_SERVICE_URL'; export MATCHING_SERVICE_URL='$LOCAL_MATCHING_SERVICE_URL'; export COLLAB_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; export COLLABORATION_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; export NEXT_PUBLIC_COLLAB_SERVICE_WS_URL='$LOCAL_COLLAB_WS_URL'; export AI_ASSISTANT_SERVICE_URL='$LOCAL_AI_ASSISTANT_SERVICE_URL'; npm run dev"
wait_for_port "frontend" "localhost" "3000"

echo
echo "All services are ready. Open http://localhost:3000"
echo "Press Ctrl+C to stop everything."

wait
