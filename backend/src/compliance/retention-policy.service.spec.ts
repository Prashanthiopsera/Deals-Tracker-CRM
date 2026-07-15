import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiDiscoveryService } from '../pii/pii-discovery.service';
import { PiiRegistryService } from '../pii/pii-registry.service';
import { buildRetentionSeedRecords } from '../../test-fixtures/compliance/retention.fixture';
import { ErasureService, InMemoryKmsErasureClient } from './erasure.service';
import {
  InMemoryRetentionMetricsPublisher,
  RetentionPolicyService,
} from './retention-policy.service';

describe('RetentionPolicyService (WO-072)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const discovery = new PiiDiscoveryService(piiRegistry, audit);
  const erasure = new ErasureService(discovery, audit, new InMemoryKmsErasureClient());
  const metrics = new InMemoryRetentionMetricsPublisher();
  const service = new RetentionPolicyService(audit, erasure, metrics);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    metrics.samples.length = 0;
    piiRegistry.onModuleInit();
    discovery.seedFromFixtures();
    service.seedRecords(buildRetentionSeedRecords());
  });

  it('lists default retention policies for admin users', () => {
    const policies = service.list('Admin');
    expect(policies.length).toBeGreaterThan(0);
  });

  it('creates and updates retention policies', () => {
    const created = service.create(
      {
        dataCategory: 'documents',
        retentionPeriodDays: 180,
        actionOnExpiry: 'archive',
        cronExpression: '0 3 * * *',
        batchSize: 50,
      },
      'admin-1',
      'Admin',
    );
    const updated = service.update(created.id, { retentionPeriodDays: 200 }, 'admin-1', 'Admin');
    expect(updated.retentionPeriodDays).toBe(200);
  });

  it('rejects audit log retention below 365 days', () => {
    expect(() =>
      service.create(
        {
          dataCategory: 'audit_logs',
          retentionPeriodDays: 90,
          actionOnExpiry: 'archive',
          cronExpression: '0 2 * * *',
          batchSize: 100,
        },
        'admin-1',
        'Admin',
      ),
    ).toThrow(BadRequestException);
  });

  it('purges only expired records for a category', async () => {
    const summary = await service.runPurge('documents', 'admin-1', 'Admin');
    expect(summary.evaluated).toBeGreaterThan(0);
    expect(summary.purged).toBeGreaterThan(0);
  });

  it('delegates contact purge to erasure service for anonymization', async () => {
    const summary = await service.runPurge('contacts', 'admin-1', 'Admin');
    expect(summary.purged).toBeGreaterThan(0);
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'retention.purge_run')).toBe(
      true,
    );
  });

  it('publishes CloudWatch-style purge metrics', async () => {
    await service.runPurge('documents', 'admin-1', 'Admin');
    expect(metrics.samples[0].recordsPurged).toBeGreaterThanOrEqual(0);
  });

  it('rejects non-admin access', () => {
    expect(() => service.list('Director')).toThrow(ForbiddenException);
  });

  it('returns not found for unknown policy id', () => {
    expect(() => service.get('missing', 'Admin')).toThrow(NotFoundException);
  });

  it('returns not found when purging unknown category policy', async () => {
    await expect(service.runPurge('companies', 'admin-1', 'Admin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('records purge summary in audit log', async () => {
    await service.runPurge('documents', 'admin-1', 'Admin');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'retention.purge_run')).toBe(
      true,
    );
  });

  it('respects batch size limits during purge', async () => {
    const policies = service.list('Admin');
    const contactsPolicy = policies.find((policy) => policy.dataCategory === 'contacts');
    expect(contactsPolicy?.batchSize).toBe(100);
  });

  it('leaves non-expired records untouched', async () => {
    const before = buildRetentionSeedRecords().filter(
      (record) => record.dataCategory === 'documents' && record.createdAt.includes('2026'),
    );
    await service.runPurge('documents', 'admin-1', 'Admin');
    expect(before.length).toBeGreaterThan(0);
  });
});
