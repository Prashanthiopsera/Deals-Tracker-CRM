#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- audit-log.entity.spec.ts 2>&1
echo "Immutable audit logs schema tests passed"
