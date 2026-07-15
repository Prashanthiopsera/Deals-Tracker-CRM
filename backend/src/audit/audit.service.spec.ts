import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { AuditService } from './audit.service';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';

describe('AuditService (WO-044)', () => {
  const queue = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const consumer = new AuditLogConsumer(repository);
  const service = new AuditService(queue, consumer, repository);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    repository.entries.length = 0;
  });

  it('publishes domain audit events to the queue', () => {
    service.publishAuditEvent({
      actorId: '11111111-1111-1111-1111-111111111111',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: '22222222-2222-2222-2222-222222222222',
      afterState: { name: 'Acme' },
    });
    expect(queue.domainMessages).toHaveLength(1);
    expect(queue.domainMessages[0].operation).toBe('create');
  });

  it('persists queued events into audit_logs shape', async () => {
    service.publishAuditEvent({
      actorId: '11111111-1111-1111-1111-111111111111',
      actorRole: 'Director',
      operation: 'delete',
      resourceType: 'Company',
      resourceId: '22222222-2222-2222-2222-222222222222',
      beforeState: { id: '22222222-2222-2222-2222-222222222222' },
      afterState: null,
    });
    await service.processAuditEvent(queue.domainMessages[0]);
    expect(repository.entries[0].actorRole).toBe('Director');
    expect(repository.entries[0].beforeState).toMatchObject({
      id: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('queries audit entries by actor and resource', async () => {
    service.publishAuditEvent({
      actorId: 'actor-1',
      actorRole: 'Principal',
      operation: 'stage_transition',
      resourceType: 'Company',
      resourceId: 'company-1',
      beforeState: { deal_stage: 'sourced' },
      afterState: { deal_stage: 'screening' },
    });
    await service.processAuditEvent(queue.domainMessages[0]);
    const results = await service.queryAuditEvents({
      actorId: 'actor-1',
      operation: 'stage_transition',
      resourceType: 'Company',
      resourceId: 'company-1',
    });
    expect(results).toHaveLength(1);
  });
});
