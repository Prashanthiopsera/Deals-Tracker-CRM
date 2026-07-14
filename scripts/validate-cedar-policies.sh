#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if command -v cedar >/dev/null 2>&1; then
  cedar validate --schema "$ROOT/policies/cedar/schema.cedar" --policies "$ROOT/policies/cedar/rbac.cedar"
else
  echo "cedar CLI not installed — skipping local validation"
fi
