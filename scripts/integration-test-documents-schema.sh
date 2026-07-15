#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- document.entity.spec.ts 2>&1
echo "Documents schema tests passed"
