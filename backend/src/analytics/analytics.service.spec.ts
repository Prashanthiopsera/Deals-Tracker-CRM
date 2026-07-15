import { AnalyticsService } from './analytics.service';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import { StageTransitionHistoryService } from './stage-transition-history.service';

describe('AnalyticsService (WO-107)', () => {
  const service = new AnalyticsService(new StageTransitionHistoryService(), new AnalyticsMetricsService());

  it('returns pipeline summary grouped by stage', () => {
    const summary = service.pipelineSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.stages.SCREENING).toBeGreaterThan(0);
  });

  it('hides ownership details from intern workload responses', () => {
    const internView = service.workload(false);
    expect(internView.counts_by_lead).toBe(2);
  });
});
