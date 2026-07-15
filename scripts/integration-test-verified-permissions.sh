#!/usr/bin/env bash
# Smoke-test Verified Permissions IsAuthorized request shape (local evaluation).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="${ROOT}/backend/test-fixtures/cedar/is-authorized-request.json"
if [[ ! -f "$FIXTURE" ]]; then
  echo "Missing fixture: $FIXTURE" >&2
  exit 1
fi
python3 -c "import json; json.load(open('$FIXTURE'))"
echo "Verified Permissions smoke fixture valid: $FIXTURE"
