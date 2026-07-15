import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiDiscoveryService } from '../pii/pii-discovery.service';
import { PiiRegistryService } from '../pii/pii-registry.service';
import { erasureSubjectFixtures } from '../../test-fixtures/compliance/erasure.fixture';
import { ErasureService, InMemoryKmsErasureClient } from './erasure.service';

describe('ErasureService (WO-071)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const discovery = new PiiDiscoveryService(piiRegistry, audit);
  const kms = new InMemoryKmsErasureClient();
  const service = new ErasureService(discovery, audit, kms);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    kms.scheduled.length = 0;
    piiRegistry.onModuleInit();
    discovery.seedFromFixtures();
  });

  it('creates an erasure request with discovery manifest', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(request.status).toBe('COMPLETE');
    expect(request.preErasureManifest?.matchCount).toBeGreaterThan(0);
    expect(request.verificationPassed).toBe(true);
  });

  it('schedules KMS key deletion for encrypted contacts', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin', {
      contactDekArn: erasureSubjectFixtures.dekArn,
    });
    expect(request.scheduledKeyDeletions).toHaveLength(1);
    expect(kms.scheduled[0].keyArn).toBe(erasureSubjectFixtures.dekArn);
  });

  it('redacts plaintext fields with GDPR placeholder markers', async () => {
    await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(
      queue.domainMessages.some((event) => event.metadata?.action === 'erasure.field_redaction'),
    ).toBe(true);
  });

  it('verifies post-erasure discovery returns zero matches', async () => {
    await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    const postManifest = discovery.discover(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(postManifest.matchCount).toBe(0);
  });

  it('records lifecycle transitions in audit log', async () => {
    await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(
      queue.domainMessages.some((event) => event.metadata?.action === 'erasure.status_transition'),
    ).toBe(true);
  });

  it('rejects non-admin actors', async () => {
    await expect(
      service.createRequest(erasureSubjectFixtures.email, 'u1', 'Director'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when subject has no PII records', async () => {
    await expect(service.createRequest('missing@example.com', 'admin-1', 'Admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records verification audit events', async () => {
    await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'erasure.verification')).toBe(
      true,
    );
  });

  it('supports contact_id identifiers', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.contactId, 'admin-1', 'Admin');
    expect(request.verificationPassed).toBe(true);
  });

  it('preserves pre-erasure manifest for audit integrity', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(request.preErasureManifest?.matches.length).toBeGreaterThan(0);
  });

  it('transitions through KEYS_SCHEDULED_FOR_DELETION when DEK provided', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin', {
      contactDekArn: erasureSubjectFixtures.dekArn,
    });
    expect(
      queue.domainMessages.some(
        (event) => event.metadata?.action === 'erasure.kms_schedule',
      ),
    ).toBe(true);
    expect(request.status).toBe('COMPLETE');
  });

  it('retrieves erasure request by id', async () => {
    const created = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    const fetched = service.getRequest(created.id, 'Admin');
    expect(fetched.id).toBe(created.id);
  });

  it('logs each major erasure step', async () => {
    await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin', {
      contactDekArn: erasureSubjectFixtures.dekArn,
    });
    const actions = queue.domainMessages.map((event) => event.metadata?.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'pii.discovery',
        'erasure.status_transition',
        'erasure.field_redaction',
        'erasure.kms_schedule',
        'erasure.verification',
      ]),
    );
  });

  it('handles missing request lookup', () => {
    expect(() => service.getRequest('missing', 'Admin')).toThrow(NotFoundException);
  });

  it('completes verification pending stage before COMPLETE', async () => {
    const request = await service.createRequest(erasureSubjectFixtures.email, 'admin-1', 'Admin');
    expect(request.status).toBe('COMPLETE');
    expect(request.verificationPassed).toBe(true);
  });
});
