#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# SNCF Website — Docker launcher
#
#   ./start.sh            # dev server  (hot reload)  -> http://localhost:3000
#   ./start.sh dev        # same as above
#   ./start.sh prod       # production build + nginx  -> http://localhost:8080
#   ./start.sh stop       # stop and remove containers
#   ./start.sh logs       # tail logs of the running container
#   ./start.sh shell      # open a shell inside the dev container
#   ./start.sh clean      # stop + remove containers, images and volumes
#
# Ports can be overridden:  DEV_PORT=4000 ./start.sh dev
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"

DEV_PORT="${DEV_PORT:-3000}"
PROD_PORT="${PROD_PORT:-8080}"
export DEV_PORT PROD_PORT

c_grn=$'\033[0;32m'; c_ylw=$'\033[0;33m'; c_red=$'\033[0;31m'; c_off=$'\033[0m'
info() { printf '%s==>%s %s\n' "$c_grn" "$c_off" "$*"; }
warn() { printf '%s==>%s %s\n' "$c_ylw" "$c_off" "$*"; }
die()  { printf '%sERROR:%s %s\n' "$c_red" "$c_off" "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker is not installed or not on PATH."
docker compose version >/dev/null 2>&1 || die "docker compose v2 is required."
docker info >/dev/null 2>&1 || die "Docker daemon is not running. Start Docker Desktop and retry."

port_busy() { lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1; }

case "${1:-dev}" in
  dev)
    port_busy "$DEV_PORT" && warn "Port $DEV_PORT already in use — override with DEV_PORT=<port> ./start.sh dev"
    info "Building dev image..."
    docker compose --profile dev build web-dev
    info "Starting dev server on http://localhost:${DEV_PORT}"
    docker compose --profile dev up -d web-dev
    info "Waiting for Vite to come up..."
    for _ in $(seq 1 60); do
      if curl -fsS "http://localhost:${DEV_PORT}" >/dev/null 2>&1; then
        info "Ready → http://localhost:${DEV_PORT}"
        exit 0
      fi
      sleep 1
    done
    warn "Server did not answer within 60s. Recent logs:"
    docker compose --profile dev logs --tail=50 web-dev
    exit 1
    ;;

  prod)
    port_busy "$PROD_PORT" && warn "Port $PROD_PORT already in use — override with PROD_PORT=<port> ./start.sh prod"
    info "Building production image (vite build + nginx)..."
    docker compose --profile prod build web
    info "Starting production server on http://localhost:${PROD_PORT}"
    docker compose --profile prod up -d web
    for _ in $(seq 1 30); do
      if curl -fsS "http://localhost:${PROD_PORT}" >/dev/null 2>&1; then
        info "Ready → http://localhost:${PROD_PORT}"
        exit 0
      fi
      sleep 1
    done
    warn "Server did not answer within 30s. Recent logs:"
    docker compose --profile prod logs --tail=50 web
    exit 1
    ;;

  stop)
    info "Stopping containers..."
    docker compose --profile dev --profile prod down
    ;;

  logs)
    docker compose --profile dev --profile prod logs -f --tail=100
    ;;

  shell)
    docker compose --profile dev exec web-dev bash
    ;;

  clean)
    info "Removing containers, images and volumes..."
    docker compose --profile dev --profile prod down --rmi local --volumes --remove-orphans
    ;;

  *)
    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
