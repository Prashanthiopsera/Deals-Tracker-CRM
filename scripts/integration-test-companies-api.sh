#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
npm test -- companies.service.spec.ts companies.dto 2>&1
echo "Company CRUD API tests passed"
