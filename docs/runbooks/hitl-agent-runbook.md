# HITL Agent Operational Runbooks

## AgentDLQ messages accumulating
- Symptom: DLQ depth > 0 on AgentQueue.
- Diagnosis: inspect failed task payloads and Cedar/Bedrock errors.
- Resolution: fix root dependency, replay messages, flush DLQ after verification.

## Bedrock invocation failures
- Symptom: deal_memo/follow_up tasks in `failed` status.
- Resolution: verify Bedrock circuit breaker, retry after cooldown, notify users.

## Cedar policy evaluation timeouts
- Symptom: approvals rejected with authorization service errors.
- Resolution: check Verified Permissions health, invalidate Cedar cache, retry approval.

## Enrichment connector API failures
- Symptom: enrichment tasks failed with ZoomInfo/Apollo errors.
- Resolution: validate Secrets Manager credentials, inspect connector circuit breakers.

## Pipeline monitor job failures
- Symptom: no pipeline_monitor tasks created on schedule.
- Resolution: verify PIPELINE_MONITOR_CRON worker, check CloudWatch alarm, replay scan.
