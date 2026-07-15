import { StructuredLogger, RequestLoggingMiddleware } from './structured-logger';

describe('StructuredLogger', () => {
  it('writes JSON logs with required fields', () => {
    const logger = new StructuredLogger();
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    logger.log('hello', { operation: 'test', userId: 'u1' });
    logger.warn('careful', { operation: 'warn-op' });
    logger.error('failed', 'stack-trace', { operation: 'err-op' });

    const output = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.operation).toBe('test');
    expect(parsed.userId).toBe('u1');
    expect(parsed.timestamp).toBeDefined();

    const warnParsed = JSON.parse(spy.mock.calls[1][0] as string) as Record<string, unknown>;
    expect(warnParsed.level).toBe('warn');

    spy.mockRestore();
  });

  it('logs HTTP requests through middleware', () => {
    const logger = new StructuredLogger();
    const middleware = new RequestLoggingMiddleware(logger);
    const spy = jest.spyOn(logger, 'write').mockImplementation(() => undefined);
    const req = {
      method: 'GET',
      path: '/api/health',
      headers: { 'x-amzn-trace-id': 'trace-1' },
    } as never;
    const res = { statusCode: 200, on: jest.fn((event, cb) => event === 'finish' && cb()) } as never;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(
      'info',
      'HTTP request completed',
      expect.objectContaining({ traceId: 'trace-1', statusCode: 200 }),
    );
    spy.mockRestore();
  });
});
