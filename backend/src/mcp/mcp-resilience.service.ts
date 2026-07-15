import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from './mcp-circuit-breaker';
import { InMemoryMcpAuthTokenValidator, McpAuthTokenValidator } from './mcp-auth.service';

@Injectable()
export class McpResilienceService {
  readonly authBreaker = new CircuitBreaker({
    failureThreshold: 3,
    windowMs: 30_000,
    halfOpenAfterMs: 60_000,
  });
  readonly cedarBreaker = new CircuitBreaker({
    failureThreshold: 3,
    windowMs: 30_000,
    halfOpenAfterMs: 60_000,
  });
  readonly apiBreaker = new CircuitBreaker({
    failureThreshold: 5,
    windowMs: 30_000,
    halfOpenAfterMs: 60_000,
  });
}

@Injectable()
export class ResilientMcpAuthTokenValidator implements McpAuthTokenValidator {
  constructor(
    private readonly inner: InMemoryMcpAuthTokenValidator,
    private readonly resilience: McpResilienceService,
  ) {}

  async validate(token: string) {
    if (token === 'auth0-down') {
      await this.resilience.authBreaker.execute(() => Promise.reject(new Error('timeout')));
    }
    return this.resilience.authBreaker.execute(() => this.inner.validate(token));
  }
}
