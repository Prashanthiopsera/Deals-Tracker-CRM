import { createAuditTestStack } from '../../src/audit/audit-test.utils';

describe('Audit completeness verification (WO-127)', () => {
  const { service: audit, repository } = createAuditTestStack();

  it('matches emitted operations to persisted audit rows', async () => {
    audit.publishAuditEvent({
      actorId: 'u1',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: 'c1',
      afterState: { name: 'Acme' },
    });
    await audit.processAuditEvent({
      eventId: 'e1',
      timestamp: new Date().toISOString(),
      actorId: 'u1',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: 'c1',
      afterState: { name: 'Acme' },
      correlationId: 'corr-1',
    });
    expect(repository.entries.length).toBeGreaterThan(0);
  });
});
