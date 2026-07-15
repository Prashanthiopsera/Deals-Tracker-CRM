# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Combined image: NestJS backend (:3000) + Next.js frontend (:3001) in ONE image.
# Built by the Forge "build-node" step (target: runtime) and deployed as the
# single "deals-tracker-crm" Deployment. A start script runs both processes.
# ─────────────────────────────────────────────────────────────────────────────

# ── Backend build (NestJS) ──────────────────────────────────────────────────
FROM node:20-alpine AS backend-build
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build && npm prune --omit=dev

# ── Frontend build (Next.js → standalone) ───────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# NEXT_PUBLIC_* is baked at build time. Points the browser at the API host on
# the wildcard domain. Override with --build-arg if the host changes.
ARG NEXT_PUBLIC_API_URL=https://p7vc-crm-api.agent.opsera.dev
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runtime: both apps in one image ─────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p /tmp && chown app:app /tmp

# Backend → /app/backend  (entrypoint runs migrations then `node dist/src/main.js`)
COPY --chown=app:app --from=backend-build /backend/dist ./backend/dist
COPY --chown=app:app --from=backend-build /backend/node_modules ./backend/node_modules
COPY --chown=app:app --from=backend-build /backend/package.json ./backend/package.json
COPY --chown=app:app backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

# Frontend (Next standalone) → /app/frontend  (`node server.js`)
COPY --chown=app:app --from=frontend-build /frontend/.next/standalone ./frontend/
COPY --chown=app:app --from=frontend-build /frontend/.next/static ./frontend/.next/static

# Supervisor that runs both processes
COPY --chown=app:app start.sh ./start.sh
RUN chmod +x ./start.sh ./backend/docker-entrypoint.sh

USER app
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["/app/start.sh"]
