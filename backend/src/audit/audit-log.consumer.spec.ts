import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { DomainAuditEvent } from './audit-log.types';

describe('AuditLogConsumer (WO-044)', () => {
  const repository = new InMemoryAuditLogRepository();
  const consumer = new AuditLogConsumer(repository);

  beforeEach(() => {
    repository.entries.length = 0;
  });

  const baseEvent = (): DomainAuditEvent => ({
    eventId: '44444444-4444-4444-4444-444444444444',
    actorId: '11111111-1111-1111-1111-111111111111',
    actorRole: 'Associate',
    operation: 'update',
    resourceType: 'Company',
    resourceId: '22222222-2222-2222-2222-222222222222',
    beforeState: { notes: 'old' },
    afterState: { notes: 'new' },
    timestamp: new Date().toISOString(),
  });

  it('maps ownership_reassignment to reassign action', async () => {
    await consumer.persist({ ...baseEvent(), operation: 'ownership_reassignment' });
    expect(repository.entries[0].action).toBe('reassign');
  });

  it('computes affected fields when not provided', async () => {
    await consumer.persist(baseEvent());
    expect(repository.entries[0].changedFields).toContain('notes');
  });
});
