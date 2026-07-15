import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { AuditService } from './audit.service';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';

describe('audit event capture integration (WO-051)', () => {
  const queue = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const consumer = new AuditLogConsumer(repository);
  const service = new AuditService(queue, consumer, repository);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    repository.entries.length = 0;
  });

  it('publishes structured events to the queue and persists through consumer', async () => {
    service.publishAuditEvent({
      actorId: '11111111-1111-1111-1111-111111111111',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: '22222222-2222-2222-2222-222222222222',
      afterState: { name: 'Acme' },
      correlationId: '33333333-3333-3333-3333-333333333333',
    });

    expect(queue.domainMessages[0].correlationId).toBe('33333333-3333-3333-3333-333333333333');
    await service.processAuditEvent(queue.domainMessages[0]);
    expect(repository.entries[0].metadata).toMatchObject({
      correlation_id: '33333333-3333-3333-3333-333333333333',
    });
  });
});
