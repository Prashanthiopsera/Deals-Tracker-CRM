import { createAuditTestStack } from '../audit/audit-test.utils';
import { AnalyticsMetricsService } from '../analytics/analytics-metrics.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { StageTransitionHistoryService } from '../analytics/stage-transition-history.service';
import { ReportGenerationService } from './report-generation.service';

describe('ReportGenerationService (WO-116)', () => {
  const { service: audit } = createAuditTestStack();
  const analytics = new AnalyticsService(new StageTransitionHistoryService(), new AnalyticsMetricsService());
  const reports = new ReportGenerationService(audit, analytics);

  it('queues report jobs for directors', () => {
    const job = reports.enqueue({
      actorId: 'director-1',
      role: 'Director',
      formats: ['pdf', 'pptx'],
      filters: {},
    });
    expect(job.status).toBe('queued');
  });

  it('rejects associate report requests', () => {
    expect(() =>
      reports.enqueue({
        actorId: 'associate-1',
        role: 'Associate',
        formats: ['pdf'],
        filters: {},
      }),
    ).toThrow('Forbidden');
  });
});
