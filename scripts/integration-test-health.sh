#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose -f docker-compose.test.yml up -d --build --wait

cleanup() {
  docker compose -f docker-compose.test.yml down -v
}
trap cleanup EXIT

curl -sf http://127.0.0.1:3000/api/health | grep -q '"status"'
curl -sf http://127.0.0.1:3000/api/health/ready | grep -q '"ready":true'

echo "Integration health checks passed."
