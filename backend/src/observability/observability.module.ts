import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StructuredLogger, RequestLoggingMiddleware } from './structured-logger';
import { TracingInterceptor } from './tracing.interceptor';

@Module({
  providers: [
    StructuredLogger,
    RequestLoggingMiddleware,
    { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
  ],
  exports: [StructuredLogger],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
