import { XrayTracingService } from './xray-tracing.service';

describe('XrayTracingService (WO-062)', () => {
  it('starts and ends spans', () => {
    const svc = new XrayTracingService();
    const span = svc.startSpan('api.request');
    expect(span.traceId).toMatch(/^trace-/);
    span.end();
  });
});
