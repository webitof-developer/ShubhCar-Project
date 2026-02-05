#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

error() { echo "ERROR: $*" >&2; }
warn() { echo "WARN: $*" >&2; }

APP_PID=""
CONTAINER_ID=""

cleanup() {
  if [[ -n "$APP_PID" ]] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" >/dev/null 2>&1 || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  if [[ -n "$CONTAINER_ID" ]]; then
    docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

require_file() {
  if [[ ! -f "$1" ]]; then
    error "Required file missing: $1"
    exit 1
  fi
}

check_env_vars() {
  local missing=0
  local required_envs=(
    NODE_ENV
    PORT
    JWT_SECRET
    JWT_EXPIRES_IN
    JWT_REFRESH_SECRET
    JWT_REFRESH_EXPIRES_IN
    SMTP_HOST
    SMTP_PORT
    SMTP_USER
    SMTP_PASS
    STRIPE_SECRET_KEY
    RAZORPAY_KEY_ID
    RAZORPAY_KEY_SECRET
  )

  if [[ -z "${MONGO_URI:-}" && -z "${MONGO_REPLICA_URI:-}" ]]; then
    error "Missing required env: MONGO_URI or MONGO_REPLICA_URI"
    missing=1
  fi

  for var in "${required_envs[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      error "Missing required env: $var"
      missing=1
    fi
  done

  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

install_dependencies() {
  require_file "package-lock.json"
  echo "Running npm ci..."
  npm ci
}

wait_for_http() {
  local url="$1"
  local retries=40
  local delay=0.5
  local attempt=1
  while [[ $attempt -le $retries ]]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if ! kill -0 "$APP_PID" 2>/dev/null; then
      error "Application process exited unexpectedly. Logs:"
      cat "$APP_LOG"
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$delay"
  done
  error "Service did not become ready at $url"
  cat "$APP_LOG"
  return 1
}

boot_check() {
  APP_LOG="$(mktemp)"
  echo "Starting application for boot check..."
  NODE_ENV=production PORT="${PORT}" node server.js >"$APP_LOG" 2>&1 &
  APP_PID=$!

  wait_for_http "http://127.0.0.1:${PORT}/health"

  local health_output
  health_output="$(mktemp)"
  local timing
  timing=$(curl -s -o "$health_output" -w "%{http_code} %{time_total}" --max-time 2 "http://127.0.0.1:${PORT}/health")
  local status_code
  status_code=$(echo "$timing" | awk '{print $1}')
  local time_total
  time_total=$(echo "$timing" | awk '{print $2}')

  if [[ "$status_code" -ne 200 ]]; then
    error "Health endpoint returned $status_code"
    cat "$APP_LOG"
    exit 1
  fi

  local time_ms
  time_ms=$(awk -v t="$time_total" 'BEGIN {printf "%.0f", t*1000}')
  if [[ "$time_ms" -gt 500 ]]; then
    error "Health endpoint exceeded 500ms (${time_ms}ms)"
    cat "$APP_LOG"
    exit 1
  fi

  echo "Boot check passed (status=$status_code, duration=${time_ms}ms)"
  kill "$APP_PID" >/dev/null 2>&1 || true
  wait "$APP_PID" 2>/dev/null || true
  APP_PID=""
}

docker_gate() {
  if [[ ! -f "Dockerfile" ]]; then
    return
  fi

  echo "Running Docker gate..."
  docker build -t prod-gate-check . >/dev/null

  local env_args=(
    --env NODE_ENV=production
    --env PORT="${PORT}"
    --env JWT_SECRET="${JWT_SECRET}"
    --env JWT_EXPIRES_IN="${JWT_EXPIRES_IN}"
    --env JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
    --env JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN}"
    --env SMTP_HOST="${SMTP_HOST}"
    --env SMTP_PORT="${SMTP_PORT}"
    --env SMTP_USER="${SMTP_USER}"
    --env SMTP_PASS="${SMTP_PASS}"
    --env STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
    --env RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID}"
    --env RAZORPAY_KEY_SECRET="${RAZORPAY_KEY_SECRET}"
  )

  if [[ -n "${MONGO_URI:-}" ]]; then
    env_args+=(--env "MONGO_URI=${MONGO_URI}")
  fi
  if [[ -n "${MONGO_REPLICA_URI:-}" ]]; then
    env_args+=(--env "MONGO_REPLICA_URI=${MONGO_REPLICA_URI}")
  fi

  CONTAINER_ID=$(
    docker run -d "${env_args[@]}" -p "${PORT}:${PORT}" --name prod-gate-check prod-gate-check
  )

  local attempts=0
  local max_attempts=30
  while [[ $attempts -lt $max_attempts ]]; do
    local status
    status=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "starting")
    if [[ "$status" == "healthy" ]]; then
      echo "Docker healthcheck passed"
      break
    fi
    if [[ "$status" == "unhealthy" ]]; then
      error "Docker healthcheck failed"
      docker logs "$CONTAINER_ID" || true
      exit 1
    fi
    attempts=$((attempts + 1))
    sleep 2
  done

  if [[ $attempts -ge $max_attempts ]]; then
    error "Docker healthcheck timed out"
    docker logs "$CONTAINER_ID" || true
    exit 1
  fi

  docker stop "$CONTAINER_ID" >/dev/null
  docker rm "$CONTAINER_ID" >/dev/null
  CONTAINER_ID=""
  docker rmi prod-gate-check >/dev/null 2>&1 || true
}

soft_gates() {
  if [[ ! -d "load-tests" ]]; then
    warn "Load test results not present (load-tests/ missing)"
  fi
  if [[ ! -d "docs/alerts" && ! -f "docs/alerts.md" && ! -f "ops/alerts.md" ]]; then
    warn "Alerts not configured (no alert docs found)"
  fi
  if [[ ! -f "rollback.tar.gz" && ! -f "ops/rollback.md" && ! -f "docs/rollback.md" ]]; then
    warn "Rollback artifact missing"
  fi
}

main() {
  check_env_vars
  install_dependencies
  boot_check
  docker_gate
  soft_gates
  echo "Production gate passed"
}

main "$@"
