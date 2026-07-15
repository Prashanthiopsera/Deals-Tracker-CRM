#!/bin/sh
set -e
if [ -n "${DATABASE_URL}" ] && [ "${SKIP_MIGRATIONS}" != "true" ]; then
  echo "Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
fi
exec node dist/main.js
