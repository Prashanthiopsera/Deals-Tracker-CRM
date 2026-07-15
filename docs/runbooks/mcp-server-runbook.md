# MCP Server Operational Runbook

## Restart procedure
1. Drain active MCP sessions via load balancer.
2. Restart the NestJS MCP module container/task.
3. Verify `GET /mcp/health` returns `status: ok`.

## Rate limit adjustment
- Default: 60 tool calls/minute/user via `McpRateLimiter`.
- Override per tenant via environment variable `MCP_RATE_LIMIT_PER_MINUTE`.

## Cedar cache flush
- Call `CedarAuthorizationService.invalidateUser(userId)` for targeted flush.
- Set `REDIS_URL` flush or restart for full cache clear.

## Log investigation
- Query structured logs by `correlation_id`, `user_id`, or `tool_name`.
- Filter error spikes with `status_code >= 400`.

## Common errors
- `AUTH_FAILED`: expired or invalid JWT — re-authenticate MCP session.
- `PERMISSION_DENIED`: Cedar deny — expected for restricted roles.
- `RATE_LIMITED`: backoff using `Retry-After` header value.
