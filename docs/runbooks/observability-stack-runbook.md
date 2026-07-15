# Observability Stack Runbook (WO-015)

## CloudWatch dashboards
- Open `DealsTracker/AnalyticsSLO` and `DealsTracker/SecurityOps` dashboards.
- Verify p95 latency, error rate, and WAF blocked-request widgets are receiving data.

## Alarms
- `AnalyticsP95Latency` — investigate ECS task CPU/memory and RDS connections.
- `WafBlockedRequests` — review blocked IP patterns in WAF logs.

## Escalation
1. Check recent deploys in GitHub Actions.
2. Scale ECS desired count if CPU > 70% for 10 minutes.
3. Page on-call if error rate > 5% for 5 minutes.
