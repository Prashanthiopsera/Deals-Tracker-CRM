#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- user.entity.spec.ts 2>&1
echo "Users schema tests passed"
