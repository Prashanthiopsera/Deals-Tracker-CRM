#!/usr/bin/env bash
# Validate RLS migration artifacts and session-variable helpers.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"
npm test -- rls-policies.spec.ts rls-context.middleware.spec.ts 2>&1
echo "RLS policy unit tests passed"
