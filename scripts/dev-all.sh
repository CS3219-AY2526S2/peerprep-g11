#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()
REDIS_CONTAINER_NAME=""
TASK_PIDS=()
TASK_NAMES=()

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

ensure_python_dependencies() {
  local dir="$1"
  local requirements_file="$ROOT_DIR/$dir/requirements.txt"
  local install_stamp="$ROOT_DIR/$dir/.venv/.codex-requirements-installed"

  if [ ! -f "$requirements_file" ]; then
    return
  fi

  if [ -f "$install_stamp" ] && [ "$install_stamp" -nt "$requirements_file" ]; then
    return
  fi

  echo "Installing Python dependencies for $dir"
  (
    cd "$ROOT_DIR/$dir"
    source .venv/bin/activate
    python -m pip install -r requirements.txt
    touch "$install_stamp"
  )
}

start_task() {
  local name="$1"
  local cmd="$2"

  echo "[$name] starting"
  bash -lc "$cmd" &
  TASK_PIDS+=("$!")
  TASK_NAMES+=("$name")
}

wait_for_tasks() {
  local i

  for i in "${!TASK_PIDS[@]}"; do
    if ! wait "${TASK_PIDS[$i]}"; then
      echo "[${TASK_NAMES[$i]}] failed"
      exit 1
    fi
  done

  TASK_PIDS=()
  TASK_NAMES=()
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

  if [ -n "$REDIS_CONTAINER_NAME" ]; then
    echo "Stopping Redis container..."
    docker stop "$REDIS_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

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

start_local_redis_if_needed() {
  local host="$1"
  local port="$2"

  if nc -z "$host" "$port" >/dev/null 2>&1; then
    echo "Redis is already running on $host:$port"
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Redis is not running on $host:$port and Docker is not installed."
    echo "Start Redis manually, then run ./scripts/dev-all.sh again."
    exit 1
  fi

  REDIS_CONTAINER_NAME="peerprep-dev-redis-$$"
  echo "Starting Redis in Docker on $host:$port"
  docker run -d --rm --name "$REDIS_CONTAINER_NAME" -p "$port:6379" redis:7-alpine >/dev/null

  wait_for_port "redis" "$host" "$port" 30
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
LOCAL_REDIS_HOST="localhost"
LOCAL_REDIS_PORT="6379"
LOCAL_REDIS_URI="redis://$LOCAL_REDIS_HOST:$LOCAL_REDIS_PORT"

start_local_redis_if_needed "$LOCAL_REDIS_HOST" "$LOCAL_REDIS_PORT"

ensure_python_venv "question-service"

start_task "question-service dependencies" "cd '$ROOT_DIR/question-service' && if [ ! -f requirements.txt ]; then exit 0; fi; if [ -f .venv/.codex-requirements-installed ] && [ .venv/.codex-requirements-installed -nt requirements.txt ]; then exit 0; fi; source .venv/bin/activate && python -m pip install -r requirements.txt && touch .venv/.codex-requirements-installed"
start_task "collaboration-service dependencies" "cd '$ROOT_DIR/collaboration-service' && [ -d node_modules ] || npm install"
start_task "user-service dependencies" "cd '$ROOT_DIR/user-service' && [ -d node_modules ] || npm install"
start_task "ai-assistant-service dependencies" "cd '$ROOT_DIR/ai-assistant-service' && [ -d node_modules ] || npm install"
start_task "frontend dependencies" "cd '$ROOT_DIR/frontend' && [ -d node_modules ] || npm install"
wait_for_tasks

assert_port_free "question-service" "8000"
assert_port_free "collaboration-service" "1234"
assert_port_free "user-service" "4001"
assert_port_free "ai-assistant-service" "4002"
assert_port_free "matching-service" "8080"
assert_port_free "frontend" "3000"

start_service "question-service" "question-service" "source .venv/bin/activate && export REDIS_URI='$LOCAL_REDIS_URI'; python main.py"
start_service "collaboration-service" "collaboration-service" "npm run dev"
start_service "user-service" "user-service" "export FRONTEND_ORIGIN='$LOCAL_FRONTEND_ORIGIN'; npm run dev"
start_service "ai-assistant-service" "ai-assistant-service" "export FRONTEND_ORIGIN='$LOCAL_FRONTEND_ORIGIN'; npm run dev"

wait_for_http "question-service" "$LOCAL_QUESTION_SERVICE_URL/health"
wait_for_http "collaboration-service" "$LOCAL_COLLAB_SERVICE_URL/health"
wait_for_http "user-service" "$LOCAL_USER_SERVICE_URL/health"
wait_for_http "ai-assistant-service" "$LOCAL_AI_ASSISTANT_SERVICE_URL/health"

start_service "matching-service" "matching-service" "export QUESTION_SERVICE_URL='$LOCAL_QUESTION_SERVICE_URL'; export COLLABORATION_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; export SPRING_REDIS_HOST='$LOCAL_REDIS_HOST'; export SPRING_REDIS_PORT='$LOCAL_REDIS_PORT'; ./gradlew bootRun"
wait_for_port "matching-service" "localhost" "8080"

start_service "frontend" "frontend" "export USER_SERVICE_URL='$LOCAL_USER_SERVICE_URL'; export QUESTION_SERVICE_URL='$LOCAL_QUESTION_SERVICE_URL'; export MATCHING_SERVICE_URL='$LOCAL_MATCHING_SERVICE_URL'; export COLLAB_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; export COLLABORATION_SERVICE_URL='$LOCAL_COLLAB_SERVICE_URL'; export NEXT_PUBLIC_COLLAB_SERVICE_WS_URL='$LOCAL_COLLAB_WS_URL'; export AI_ASSISTANT_SERVICE_URL='$LOCAL_AI_ASSISTANT_SERVICE_URL'; npm run dev"
wait_for_port "frontend" "localhost" "3000"

echo
echo "All services are ready. Open http://localhost:3000"
echo "Press Ctrl+C to stop everything."

wait
