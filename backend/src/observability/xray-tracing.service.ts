import { Injectable } from '@nestjs/common';

@Injectable()
export class XrayTracingService {
  startSpan(name: string): { name: string; traceId: string; end: () => void } {
    const traceId = `trace-${Date.now()}`;
    return { name, traceId, end: () => undefined };
  }
}
