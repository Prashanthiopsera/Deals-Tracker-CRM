# Analytics SLO Runbook

## Analytics p95 latency > 500ms

- **Symptom:** `analytics-p95-latency` alarm in SNS topic `p7vc-analytics-alerts`.
- **Diagnosis:** Check CloudWatch dashboard `P7VC-Analytics-SLOs` for endpoint latency spikes and Aurora CPU.
- **Resolution:** Scale ECS tasks, verify stage_transitions indexes, roll back recent analytics deploy if regression.

## Analytics 5xx error rate > 5%

- **Symptom:** Elevated `analytics.requests.5xx` metric.
- **Diagnosis:** Inspect application logs for AnalyticsService stack traces and Cedar authorization denials.
- **Resolution:** Fix failing query path, validate AnalyticsModule wiring, replay failed requests after fix.

## Stage transitions data staleness

- **Symptom:** No `stage_transitions.inserts` in 24 hours on weekdays.
- **Diagnosis:** Verify company stage update API and PostgreSQL trigger health.
- **Resolution:** Run manual stage transition on test company, replay migration if trigger missing.

## Escalation

1. On-call SRE via PagerDuty subscription on `p7vc-analytics-alerts`.
2. Escalate to platform team if Aurora or ECS infrastructure is root cause.
