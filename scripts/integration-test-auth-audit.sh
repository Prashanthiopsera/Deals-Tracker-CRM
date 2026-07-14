#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="${ROOT}/backend/test-fixtures/audit/authorization-audit-event.json"
python3 -c "import json; json.load(open('$FIXTURE'))"
cd "${ROOT}/backend"
npm test -- authorization-audit.service.spec.ts 2>&1
echo "Authorization audit pipeline tests passed"
