# WAF and API Gateway Security Runbook

## Blocked request spike alarm

- Inspect WAF sampled requests in CloudWatch Logs group `aws-waf-logs-*`.
- Validate geo-restriction false positives for VPN users.
- Tune rate limit if legitimate traffic is blocked.

## Payload size violations

- API Gateway returns 413 for payloads over 10MB.
- Confirm client retry with chunked upload for document endpoints.

## Test payloads

See `backend/test-fixtures/security/waf-payloads.fixture.ts` for SQLi/XSS/oversized samples used in integration tests.
