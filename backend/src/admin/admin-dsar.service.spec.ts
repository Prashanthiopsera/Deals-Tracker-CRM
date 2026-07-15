import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiRegistryService } from '../pii/pii-registry.service';
import {
  AdminDsarService,
  InMemoryDsarObjectStore,
} from './admin-dsar.service';

describe('AdminDsarService (WO-067)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const objectStore = new InMemoryDsarObjectStore();
  const service = new AdminDsarService(piiRegistry, audit, objectStore);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    objectStore.objects.clear();
    piiRegistry.onModuleInit();
    service.seedFromFixtures();
  });

  it('discovers records grouped by entity type for a data subject email', () => {
    const request = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(request.report.contacts).toHaveLength(1);
    expect(request.report.companies).toHaveLength(1);
    expect(request.report.activities).toHaveLength(1);
    expect(request.report.auditLogs).toHaveLength(1);
    expect(request.report.totalRecords).toBe(4);
    expect(queue.domainMessages[0].metadata).toMatchObject({ action: 'dsar.discover' });
  });

  it('exports discovered PII to encrypted object storage and audits the action', async () => {
    const request = service.discover('ada@example.com', 'admin-1', 'Admin');
    const exported = await service.exportRequest(request.id, 'admin-1', 'Admin');

    expect(exported.s3Key).toContain(request.id);
    expect(objectStore.objects.has(exported.s3Key)).toBe(true);
    const payload = JSON.parse(objectStore.objects.get(exported.s3Key)!);
    expect(payload.records.contacts[0].email).toBe('ada@example.com');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'dsar.export')).toBe(
      true,
    );
  });

  it('anonymizes discovered records and annotates audit logs without deleting them', () => {
    const request = service.discover('ada@example.com', 'admin-1', 'Admin');
    const erased = service.eraseRequest(request.id, 'admin-1', 'Admin');

    expect(erased.anonymizedRecordCount).toBe(4);
    const stored = service.getRequest(request.id, 'Admin');
    expect(stored.status).toBe('erased');
    expect(stored.report.contacts[0].email).not.toBe('ada@example.com');
    expect(stored.report.auditLogs[0].metadata.erasureMarker).toContain('erased:');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'dsar.erase')).toBe(
      true,
    );
  });

  it('rejects non-admin actors and missing requests', async () => {
    expect(() => service.discover('ada@example.com', 'u1', 'Director')).toThrow(
      ForbiddenException,
    );
    await expect(service.exportRequest('missing', 'admin-1', 'Admin')).rejects.toThrow(
      NotFoundException,
    );
  });
});
