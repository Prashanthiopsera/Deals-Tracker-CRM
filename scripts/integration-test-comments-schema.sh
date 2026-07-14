#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- comment.entity.spec.ts 2>&1
echo "Comments schema tests passed"
