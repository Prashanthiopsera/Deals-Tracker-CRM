import { Injectable, NestMiddleware, LoggerService } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  operation?: string;
  resource?: string;
  duration?: number;
  error?: { name: string; message: string };
}

@Injectable()
export class StructuredLogger implements LoggerService {
  log(message: string, context?: Record<string, unknown>) {
    this.write('info', message, context);
  }

  error(message: string, trace?: string, context?: Record<string, unknown>) {
    this.write('error', message, { ...context, stack: trace });
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.write('warn', message, context);
  }

  write(level: string, message: string, context: Record<string, unknown> = {}) {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    const traceId = (req.headers['x-amzn-trace-id'] as string) ?? undefined;

    res.on('finish', () => {
      this.logger.write('info', 'HTTP request completed', {
        traceId,
        operation: `${req.method} ${req.path}`,
        resource: req.path,
        duration: Date.now() - started,
        statusCode: res.statusCode,
      });
    });

    next();
  }
}
