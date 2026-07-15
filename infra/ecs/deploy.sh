#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy both services to AWS ECS Fargate
# Usage: ./infra/ecs/deploy.sh <env> <aws-region> <account-id>
# Example: ./infra/ecs/deploy.sh dev us-east-1 123456789012
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ENV=${1:-dev}
REGION=${2:-us-east-1}
ACCOUNT_ID=${3:?"account-id is required"}

API_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/p7vc-crm-api"
FE_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/p7vc-crm-frontend"
TAG="${ENV}-$(git rev-parse --short HEAD)"

echo "==> Logging into ECR"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> Building API image"
docker build -t "${API_REPO}:${TAG}" -t "${API_REPO}:${ENV}-latest" \
  -f Dockerfile .

echo "==> Building Frontend image"
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api.p7vc-crm.com" \
  -t "${FE_REPO}:${TAG}" -t "${FE_REPO}:${ENV}-latest" \
  -f frontend/Dockerfile frontend/

echo "==> Pushing images"
docker push "${API_REPO}:${TAG}"
docker push "${API_REPO}:${ENV}-latest"
docker push "${FE_REPO}:${TAG}"
docker push "${FE_REPO}:${ENV}-latest"

echo "==> Updating ECS services"
aws ecs update-service \
  --region "$REGION" \
  --cluster "p7vc-crm-${ENV}" \
  --service "p7vc-crm-api-${ENV}" \
  --force-new-deployment \
  --output text --query 'service.serviceName'

aws ecs update-service \
  --region "$REGION" \
  --cluster "p7vc-crm-${ENV}" \
  --service "p7vc-crm-frontend-${ENV}" \
  --force-new-deployment \
  --output text --query 'service.serviceName'

echo "==> Waiting for API service to stabilise"
aws ecs wait services-stable \
  --region "$REGION" \
  --cluster "p7vc-crm-${ENV}" \
  --services "p7vc-crm-api-${ENV}"

echo "==> Waiting for Frontend service to stabilise"
aws ecs wait services-stable \
  --region "$REGION" \
  --cluster "p7vc-crm-${ENV}" \
  --services "p7vc-crm-frontend-${ENV}"

echo "✅  Deploy complete — ${TAG}"
