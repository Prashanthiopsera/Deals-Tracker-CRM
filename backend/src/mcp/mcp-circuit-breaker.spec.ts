import { CircuitBreaker } from './mcp-circuit-breaker';

describe('CircuitBreaker (WO-088)', () => {
  it('opens after consecutive failures', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      windowMs: 30_000,
      halfOpenAfterMs: 60_000,
    });
    const fail = () => Promise.reject(new Error('down'));
    await expect(breaker.execute(fail)).rejects.toThrow('down');
    await expect(breaker.execute(fail)).rejects.toThrow('down');
    await expect(breaker.execute(fail)).rejects.toThrow('down');
    expect(breaker.state).toBe('open');
    await expect(breaker.execute(fail)).rejects.toThrow('CIRCUIT_OPEN');
  });

  it('recovers after half-open probe succeeds', async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      windowMs: 30_000,
      halfOpenAfterMs: 100,
    });
    await expect(breaker.execute(() => Promise.reject(new Error('down')))).rejects.toThrow();
    jest.advanceTimersByTime(150);
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(breaker.state).toBe('closed');
    jest.useRealTimers();
  });
});
