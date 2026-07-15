import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { Observable, tap } from 'rxjs';
import { StructuredLogger } from './structured-logger';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('p7vc-crm-backend');

  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      path: string;
    }>();
    const spanName = `${req.method} ${req.path}`;

    return this.tracer.startActiveSpan(spanName, (span) => {
      const started = Date.now();
      return next.handle().pipe(
        tap({
          next: () => {
            span.setStatus({ code: SpanStatusCode.OK });
            this.logger.write('info', 'Request traced', {
              traceId: span.spanContext().traceId,
              spanId: span.spanContext().spanId,
              operation: spanName,
              duration: Date.now() - started,
            });
            span.end();
          },
          error: (err: Error) => {
            span.recordException(err);
            span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
            this.logger.write('error', err.message, {
              traceId: span.spanContext().traceId,
              spanId: span.spanContext().spanId,
              operation: spanName,
              error: { name: err.name, message: err.message },
            });
            span.end();
          },
        }),
      );
    });
  }
}
