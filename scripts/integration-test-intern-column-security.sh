#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- intern-column-masking.spec.ts ownership-fields.spec.ts 2>&1
echo "Intern column-level security tests passed"
