import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiDiscoveryService } from '../pii/pii-discovery.service';
import { PiiRegistryService } from '../pii/pii-registry.service';
import { dsarSubjectFixtures } from '../../test-fixtures/compliance/dsar.fixture';
import {
  DsarService,
  InMemoryDsarExportStore,
  InMemoryWorkflowTopicPublisher,
} from './dsar.service';

describe('DsarService (WO-070)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const discovery = new PiiDiscoveryService(piiRegistry, audit);
  const exportStore = new InMemoryDsarExportStore();
  const workflowTopic = new InMemoryWorkflowTopicPublisher();
  const service = new DsarService(discovery, audit, exportStore, workflowTopic);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    exportStore.objects.clear();
    workflowTopic.alerts.length = 0;
    piiRegistry.onModuleInit();
    discovery.seedFromFixtures();
  });

  it('creates a DSAR request with RECEIVED then discovery complete status', () => {
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    expect(request.id).toBeDefined();
    expect(request.status).toBe('DISCOVERY_COMPLETE');
    expect(request.manifest?.matchCount).toBeGreaterThan(0);
  });

  it('records status transitions in the audit log', () => {
    service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    expect(
      queue.domainMessages.filter((event) => event.metadata?.action === 'dsar.status_transition')
        .length,
    ).toBeGreaterThan(0);
  });

  it('generates JSON and CSV exports with KMS metadata', async () => {
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    const exported = await service.generateExport(request.id, 'admin-1', 'Admin');
    expect(exported.jsonKey).toContain(request.id);
    expect(exported.csvKey).toContain(request.id);
    expect(exported.presignedUrl).toContain('expires=72h');
    expect(exportStore.objects.has(exported.jsonKey)).toBe(true);
    expect(exportStore.objects.has(exported.csvKey)).toBe(true);
  });

  it('closes the request after export delivery', async () => {
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    await service.generateExport(request.id, 'admin-1', 'Admin');
    const closed = service.getRequest(request.id, 'Admin');
    expect(closed.status).toBe('CLOSED');
  });

  it('supports email, name, and contact_id identifiers', () => {
    for (const identifier of [
      dsarSubjectFixtures.email,
      dsarSubjectFixtures.name,
      dsarSubjectFixtures.contactId,
    ]) {
      const request = service.createRequest(identifier, 'admin-1', 'Admin');
      expect(request.manifest?.matchCount).toBeGreaterThan(0);
    }
  });

  it('returns 403 for non-admin actors', () => {
    expect(() =>
      service.createRequest(dsarSubjectFixtures.email, 'u1', 'Director'),
    ).toThrow(ForbiddenException);
  });

  it('throws when subject has no PII records', () => {
    expect(() => service.createRequest('missing@example.com', 'admin-1', 'Admin')).toThrow(
      NotFoundException,
    );
  });

  it('throws when export is requested for unknown request id', async () => {
    await expect(service.generateExport('missing', 'admin-1', 'Admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('flags SLA breach and publishes workflow alert after 48 hours', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    jest.setSystemTime(new Date('2026-07-03T01:00:00.000Z'));
    const result = service.evaluateSla(request.id, 'Admin');
    expect(result.slaBreached).toBe(true);
    expect(workflowTopic.alerts.length).toBe(1);
    jest.useRealTimers();
  });

  it('does not flag SLA breach after export is generated', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T00:00:00.000Z'));
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    jest.setSystemTime(new Date('2026-07-01T01:00:00.000Z'));
    await service.generateExport(request.id, 'admin-1', 'Admin');
    jest.setSystemTime(new Date('2026-07-05T00:00:00.000Z'));
    const result = service.evaluateSla(request.id, 'Admin');
    expect(result.slaBreached).toBe(false);
    jest.useRealTimers();
  });

  it('retrieves DSAR request by id', () => {
    const created = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    const fetched = service.getRequest(created.id, 'Admin');
    expect(fetched.subjectIdentifier).toBe(dsarSubjectFixtures.email);
  });

  it('includes discovered manifest in the request record', () => {
    const request = service.createRequest(dsarSubjectFixtures.email, 'admin-1', 'Admin');
    expect(request.manifest?.matches.some((match) => match.table === 'contacts')).toBe(true);
  });
});
