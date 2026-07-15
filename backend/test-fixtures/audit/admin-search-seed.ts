import { AuditAction } from '../../src/database/enums';

export function buildAdminAuditSearchFixture(count = 50): Array<Record<string, unknown>> {
  const actions = [
    AuditAction.CREATE,
    AuditAction.UPDATE,
    AuditAction.DELETE,
    AuditAction.REASSIGN,
    AuditAction.AI_RETRIEVAL,
    AuditAction.LOGIN,
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `${String(index).padStart(8, '0')}-0000-4000-8000-000000000001`,
    actorId: index % 2 === 0 ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222',
    actorRole: index % 3 === 0 ? 'Admin' : 'Director',
    action: actions[index % actions.length],
    entityType: index % 4 === 0 ? 'user' : 'company',
    entityId: `${String(index + 100).padStart(8, '0')}-0000-4000-8000-000000000002`,
    beforeState: null,
    afterState: { field: `value-${index}` },
    changedFields: ['field'],
    metadata: { correlation_id: `${String(index).padStart(8, '0')}-0000-4000-8000-000000000003` },
    timestamp: new Date(Date.UTC(2025, index % 12, (index % 28) + 1)),
  }));
}
