import { ExecutionContext, CallHandler } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { TracingInterceptor } from './tracing.interceptor';
import { StructuredLogger } from './structured-logger';

const mockSpan = {
  setStatus: jest.fn(),
  end: jest.fn(),
  spanContext: () => ({ traceId: 'trace-1', spanId: 'span-1' }),
  recordException: jest.fn(),
};

function mockTracer() {
  jest.spyOn(trace, 'getTracer').mockReturnValue({
    startActiveSpan: (_name: string, fn: (span: typeof mockSpan) => unknown) => fn(mockSpan),
    startSpan: jest.fn(),
  } as unknown as ReturnType<typeof trace.getTracer>);
}

describe('TracingInterceptor', () => {
  const logger = new StructuredLogger();
  let interceptor: TracingInterceptor;

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', path: '/api/health' }),
    }),
  } as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTracer();
    interceptor = new TracingInterceptor(logger);
  });

  it('creates spans and logs on success', async () => {
    await lastValueFrom(
      interceptor.intercept(mockContext, { handle: () => of({ ok: true }) } as CallHandler),
    );
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  it('records errors on failure', async () => {
    await expect(
      lastValueFrom(
        interceptor.intercept(mockContext, {
          handle: () => throwError(() => new Error('boom')),
        } as CallHandler),
      ),
    ).rejects.toThrow('boom');
    expect(mockSpan.recordException).toHaveBeenCalled();
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'boom',
    });
  });
});
