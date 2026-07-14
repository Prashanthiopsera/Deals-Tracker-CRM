#!/usr/bin/env bash
# End-to-end CedarGuard authorization checks via Jest integration specs.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"
npm test -- cedar.guard.spec.ts cedar-action-mapper.spec.ts cedar.service.spec.ts 2>&1
echo "CedarGuard integration tests passed"
