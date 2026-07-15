#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5433/p7vc_crm_test"

docker compose -f docker-compose.migrate-test.yml up -d --wait

cleanup() {
  docker compose -f "$ROOT/docker-compose.migrate-test.yml" down -v
}
trap cleanup EXIT

cd backend
npm run migration:run
npm run seed:reference
npm run seed:test

docker compose -f "$ROOT/docker-compose.migrate-test.yml" exec -T db \
  psql -U postgres -d p7vc_crm_test -c "\d users" >/dev/null
docker compose -f "$ROOT/docker-compose.migrate-test.yml" exec -T db \
  psql -U postgres -d p7vc_crm_test -c "\d companies" >/dev/null
docker compose -f "$ROOT/docker-compose.migrate-test.yml" exec -T db \
  psql -U postgres -d p7vc_crm_test -c "SELECT COUNT(*) FROM deal_pipeline_stages WHERE is_active = true" | grep -q '[1-9]'

echo "Migration integration test passed."
