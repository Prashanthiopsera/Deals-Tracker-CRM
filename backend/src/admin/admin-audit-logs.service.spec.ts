import { ForbiddenException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { buildAdminAuditSearchFixture } from '../../test-fixtures/audit/admin-search-seed';
import { AuditAction } from '../database/enums';

describe('AdminAuditLogsService (WO-053)', () => {
  const { repository, queue, service: audit } = createAuditTestStack();
  const service = new AdminAuditLogsService(repository, audit);

  beforeEach(async () => {
    repository.entries.length = 0;
    queue.domainMessages.length = 0;
    for (const entry of buildAdminAuditSearchFixture(50)) {
      await repository.insert(entry as never);
    }
  });

  it('returns paginated audit log search results for admin', async () => {
    const result = await service.search({ page: 1, pageSize: 10 }, { id: 'admin-1', role: 'Admin' });
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(5);
  });

  it('filters by actor and operation type', async () => {
    const result = await service.search(
      { actorId: '11111111-1111-1111-1111-111111111111', operationType: AuditAction.CREATE },
      { id: 'admin-1', role: 'Admin' },
    );
    expect(result.items.every((item) => item.actorId === '11111111-1111-1111-1111-111111111111')).toBe(true);
  });

  it('denies non-admin users', async () => {
    await expect(
      service.search({ page: 1 }, { id: 'director-1', role: 'Director' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('logs the search request to the audit trail', async () => {
    await service.search({ page: 1, pageSize: 5 }, { id: 'admin-1', role: 'Admin' });
    expect(queue.domainMessages.at(-1)?.metadata).toMatchObject({ search_type: 'audit_log_search' });
  });
});
