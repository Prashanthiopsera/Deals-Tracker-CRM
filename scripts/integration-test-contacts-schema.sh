#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- contact.entity.spec.ts 2>&1
echo "Contacts schema tests passed"
