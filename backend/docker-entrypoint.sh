#!/bin/sh
set -e
if [ -n "${DATABASE_URL}" ] && [ "${SKIP_MIGRATIONS}" != "true" ]; then
  echo "Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/src/database/data-source.js || \
    echo "Warning: migrations completed with errors — app will attempt to start anyway"
fi
exec node dist/src/main.js
