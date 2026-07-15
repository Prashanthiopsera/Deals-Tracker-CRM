export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  windowMs: number;
  halfOpenAfterMs: number;
}

export class CircuitBreaker {
  state: CircuitBreakerState = 'closed';
  private failures = 0;
  private openedAt = 0;
  private lastFailureAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.options.halfOpenAfterMs) {
        this.state = 'half_open';
      } else {
        throw new Error('CIRCUIT_OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    const now = Date.now();
    if (now - this.lastFailureAt > this.options.windowMs) {
      this.failures = 0;
    }
    this.failures += 1;
    this.lastFailureAt = now;
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = now;
    }
  }
}
