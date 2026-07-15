import { AnalyticsMetricsService } from './analytics-metrics.service';

describe('AnalyticsMetricsService (WO-110)', () => {
  it('records query duration metrics', () => {
    const metrics = new AnalyticsMetricsService();
    expect(() =>
      metrics.recordQuery({ endpoint: 'pipeline-summary', durationMs: 42, resultCount: 3 }),
    ).not.toThrow();
  });
});
