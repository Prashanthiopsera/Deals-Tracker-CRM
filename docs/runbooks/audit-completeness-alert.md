# Audit Completeness Alert Runbook

## Alert Description

CloudWatch alarms fire when audit operation counts diverge:

- `audit.operations.emitted` vs `audit.operations.persisted` drift exceeds 1% over 5 minutes
- Audit queue DLQ message count is greater than zero

## Investigation Steps

1. Check the P7VC-Audit-Health dashboard for emitted vs persisted time series.
2. Inspect the audit queue depth and DLQ in SQS.
3. Review AuditConsumer logs for database write failures.
4. Run the hourly reconciliation output in application logs and compare with `audit_logs` counts.

## Common Root Causes

- SQS delivery failure or throttling
- AuditConsumer crash or deployment restart
- PostgreSQL write failure or permission regression on `audit_logs`
- Application publish path bypassing `AuditService`

## Remediation

1. Replay messages from the audit DLQ after fixing the root cause.
2. Re-run reconciliation and confirm drift returns below threshold.
3. If gaps remain, backfill missing audit entries from application logs using correlation IDs.

## Escalation

Escalate to the platform on-call if drift persists for more than 15 minutes or if DLQ depth continues to grow.
