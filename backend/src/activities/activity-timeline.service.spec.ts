import { createAuditTestStack } from '../audit/audit-test.utils';
import { activityTimelineFixtures } from '../../test-fixtures/activities/activity-timeline.fixture';
import { ActivityIngestionService } from './activity-ingestion.service';
import { ActivityTimelineService } from './activity-timeline.service';

describe('ActivityTimelineService (WO-105)', () => {
  const { service: audit } = createAuditTestStack();
  const ingestion = new ActivityIngestionService(audit);
  const timeline = new ActivityTimelineService(ingestion);

  beforeEach(() => {
    for (const fixture of activityTimelineFixtures) {
      ingestion.ingest(fixture);
    }
  });

  it('returns paginated activities sorted by recency', () => {
    const result = timeline.listByCompany('11111111-1111-1111-1111-111111111111', { limit: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.has_more).toBe(true);
    expect(result.items[0]).not.toHaveProperty('raw_payload_s3_key');
  });

  it('computes last_touch from latest activity', () => {
    const lastTouch = timeline.computeLastTouch('11111111-1111-1111-1111-111111111111');
    expect(lastTouch?.activity_type).toBe('calendar_event');
  });

  it('computes next_step from upcoming calendar events', () => {
    const nextStep = timeline.computeNextStep('11111111-1111-1111-1111-111111111111');
    expect(nextStep?.subject).toContain('Partner review');
  });
});
