#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"
npm test -- ownership-fields.spec.ts 2>&1
echo "Field-level ownership authorization tests passed"
