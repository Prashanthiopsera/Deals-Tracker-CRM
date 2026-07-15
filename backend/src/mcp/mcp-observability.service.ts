import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export interface McpStructuredLog {
  correlation_id: string;
  user_id: string;
  tool_name: string;
  latency_ms: number;
  status_code: number;
  timestamp: string;
}

export interface McpMetricPublisher {
  publish(metric: string, value: number, dimensions?: Record<string, string>): void;
}

@Injectable()
export class InMemoryMcpMetricPublisher implements McpMetricPublisher {
  readonly metrics: Array<{ metric: string; value: number; dimensions?: Record<string, string> }> =
    [];

  publish(metric: string, value: number, dimensions?: Record<string, string>): void {
    this.metrics.push({ metric, value, dimensions });
  }
}

@Injectable()
export class McpRateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();
  private readonly maxPerMinute = 60;

  check(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const window = this.windows.get(userId);
    if (!window || now >= window.resetAt) {
      this.windows.set(userId, { count: 1, resetAt: now + 60_000 });
      return { allowed: true };
    }
    if (window.count >= this.maxPerMinute) {
      return { allowed: false, retryAfter: Math.ceil((window.resetAt - now) / 1000) };
    }
    window.count += 1;
    return { allowed: true };
  }
}

@Injectable()
export class McpObservabilityService {
  readonly logs: McpStructuredLog[] = [];

  constructor(
    private readonly metrics: InMemoryMcpMetricPublisher,
    private readonly rateLimiter: McpRateLimiter,
  ) {}

  assertRateLimit(userId: string): void {
    const result = this.rateLimiter.check(userId);
    if (!result.allowed) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordToolCall(input: Omit<McpStructuredLog, 'timestamp'>): void {
    const entry = { ...input, timestamp: new Date().toISOString() };
    this.logs.push(entry);
    this.metrics.publish('mcp.tool.invocations', 1, { tool_name: input.tool_name });
    this.metrics.publish('mcp.tool.latency.p95', input.latency_ms, { tool_name: input.tool_name });
    if (input.status_code >= 400) {
      this.metrics.publish('mcp.tool.errors', 1, { status_code: String(input.status_code) });
    }
  }
}
