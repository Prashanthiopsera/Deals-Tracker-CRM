import { createAuditTestStack } from '../audit/audit-test.utils';
import { ActivityIngestionService, ActivityQueueConsumer } from './activity-ingestion.service';

describe('ActivityIngestion (WO-104)', () => {
  const { service: audit } = createAuditTestStack();
  const ingestion = new ActivityIngestionService(audit);
  const consumer = new ActivityQueueConsumer(ingestion);

  it('deduplicates activities by source and external_id', () => {
    const payload = {
      company_id: '11111111-1111-1111-1111-111111111111',
      user_id: 'director-1',
      activity_type: 'email' as const,
      source: 'gmail' as const,
      participants: [],
      occurred_at: '2026-07-14T12:00:00Z',
      metadata: {},
      external_id: 'msg-1',
    };
    expect(ingestion.ingest(payload)?.id).toBeDefined();
    expect(ingestion.ingest(payload)).toBeNull();
  });

  it('consumes queue messages into activity records', () => {
    const created = consumer.consume([
      {
        company_id: '11111111-1111-1111-1111-111111111111',
        user_id: 'director-1',
        activity_type: 'meeting',
        source: 'google_calendar',
        participants: [],
        occurred_at: '2026-07-14T13:00:00Z',
        metadata: {},
        external_id: 'evt-2',
      },
    ]);
    expect(created).toHaveLength(1);
  });
});
