#!/bin/sh
# Runs the backend (:3000) and frontend (:3001) together in one container.
# If either process exits, tear down the other so Kubernetes restarts the pod.
set -e

term() {
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap term TERM INT

# Backend: migrations (if DATABASE_URL set) then `node dist/src/main.js`, listens on :3000
( cd /app/backend && exec ./docker-entrypoint.sh ) &
BACKEND_PID=$!

# Frontend: Next.js standalone server, listens on :3001
( cd /app/frontend && exec env PORT=3001 HOSTNAME=0.0.0.0 node server.js ) &
FRONTEND_PID=$!

echo "started backend(pid=$BACKEND_PID) + frontend(pid=$FRONTEND_PID)"

# Watch both; exit non-zero as soon as one dies so the pod is recreated
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 5
done

echo "a process exited — shutting down container"
term
exit 1
