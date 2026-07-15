import { InMemoryAuditCompletenessMetrics } from './audit-completeness.metrics';
import { createAuditTestStack } from './audit-test.utils';
import { AuditReconciliationService } from './audit-reconciliation.service';

describe('AuditReconciliationService (WO-054)', () => {
  const metrics = new InMemoryAuditCompletenessMetrics();
  const { queue, repository, service: audit } = createAuditTestStack();
  const service = new AuditReconciliationService(metrics, repository, audit);

  beforeEach(() => {
    metrics.emitted.clear();
    metrics.persisted.clear();
    repository.entries.length = 0;
    queue.domainMessages.length = 0;
  });

  it('detects drift when emitted exceeds persisted counts', async () => {
    await metrics.recordEmitted('create');
    await metrics.recordEmitted('update');
    const result = await service.reconcile(1);
    expect(result.emitted).toBe(2);
    expect(result.persisted).toBe(0);
    expect(result.withinThreshold).toBe(false);
  });

  it('audits reconciliation execution', async () => {
    await service.reconcile();
    expect(queue.domainMessages[0].metadata).toMatchObject({ job: 'audit_reconciliation_hourly' });
  });
});

describe('InMemoryAuditCompletenessMetrics (WO-054)', () => {
  it('tracks emitted and persisted counters per operation', async () => {
    const metrics = new InMemoryAuditCompletenessMetrics();
    await metrics.recordEmitted('delete');
    await metrics.recordPersisted('delete');
    expect(metrics.emitted.get('delete')).toBe(1);
    expect(metrics.persisted.get('delete')).toBe(1);
  });
});

describe('AuditService emitted metrics (WO-054)', () => {
  const { queue, metrics, service } = createAuditTestStack();

  beforeEach(() => {
    queue.domainMessages.length = 0;
    metrics.emitted.clear();
  });

  it('records emitted count when publishing audit events', () => {
    service.publishAuditEvent({
      actorId: '11111111-1111-1111-1111-111111111111',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Company',
      resourceId: '22222222-2222-2222-2222-222222222222',
    });
    expect(metrics.emitted.get('create')).toBe(1);
  });
});
