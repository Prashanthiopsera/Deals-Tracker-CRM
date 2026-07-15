import {
  InMemoryAuditQueuePublisher,
  LayeredAuditQueuePublisher,
  SqsAuditQueuePublisher,
} from './authorization-audit.publisher';

describe('Audit queue publishers (WO-010)', () => {
  it('stores authorization and domain events in memory', async () => {
    const publisher = new InMemoryAuditQueuePublisher();
    await publisher.publish({
      eventId: 'auth-1',
      actorId: 'a1',
      actorRole: 'Director',
      action: 'read',
      resourceType: 'Company',
      resourceId: '1',
      decision: 'allow',
      source: 'api',
      timestamp: new Date().toISOString(),
    });
    await publisher.publishDomainEvent({
      eventId: 'e1',
      actorId: 'a1',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: '1',
      timestamp: new Date().toISOString(),
    });
    expect(publisher.messages).toHaveLength(1);
    expect(publisher.domainMessages).toHaveLength(1);
  });

  it('delegates to memory and sqs in layered publisher', async () => {
    const memory = new InMemoryAuditQueuePublisher();
    const sqs = new SqsAuditQueuePublisher();
    const layered = new LayeredAuditQueuePublisher(memory, sqs);
    await layered.publish({
      eventId: 'auth-2',
      actorId: 'a1',
      actorRole: 'Director',
      action: 'read',
      resourceType: 'Company',
      resourceId: '1',
      decision: 'deny',
      source: 'mcp',
      timestamp: new Date().toISOString(),
    });
    expect(memory.messages).toHaveLength(1);
  });

  it('no-ops sqs publish when queue url is missing', async () => {
    delete process.env.AUDIT_QUEUE_URL;
    const sqs = new SqsAuditQueuePublisher();
    await sqs.publish({
      eventId: 'auth-3',
      actorId: 'a1',
      actorRole: 'Director',
      action: 'read',
      resourceType: 'Company',
      resourceId: '1',
      decision: 'deny',
      source: 'api',
      timestamp: new Date().toISOString(),
    });
    await sqs.publishDomainEvent({
      eventId: 'e1',
      actorId: 'a1',
      actorRole: 'Director',
      operation: 'update',
      resourceType: 'Company',
      resourceId: '1',
      timestamp: new Date().toISOString(),
    });
  });
});
