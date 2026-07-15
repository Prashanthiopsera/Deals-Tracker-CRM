import {
  InMemoryMcpMetricPublisher,
  McpObservabilityService,
  McpRateLimiter,
} from './mcp-observability.service';

describe('McpObservabilityService (WO-087)', () => {
  const metrics = new InMemoryMcpMetricPublisher();
  const rateLimiter = new McpRateLimiter();
  const service = new McpObservabilityService(metrics, rateLimiter);

  beforeEach(() => {
    metrics.metrics.length = 0;
    service.logs.length = 0;
  });

  it('emits structured logs with required fields', () => {
    service.recordToolCall({
      correlation_id: 'corr-1',
      user_id: 'user-1',
      tool_name: 'search_companies',
      latency_ms: 42,
      status_code: 200,
    });
    expect(service.logs[0]).toMatchObject({
      correlation_id: 'corr-1',
      tool_name: 'search_companies',
      latency_ms: 42,
    });
  });

  it('publishes invocation and latency metrics', () => {
    service.recordToolCall({
      correlation_id: 'corr-2',
      user_id: 'user-1',
      tool_name: 'get_record',
      latency_ms: 10,
      status_code: 200,
    });
    expect(metrics.metrics.some((m) => m.metric === 'mcp.tool.invocations')).toBe(true);
  });

  it('enforces 60 calls per minute per user', () => {
    for (let i = 0; i < 60; i += 1) {
      service.assertRateLimit('user-rate');
    }
    expect(() => service.assertRateLimit('user-rate')).toThrow();
  });
});
