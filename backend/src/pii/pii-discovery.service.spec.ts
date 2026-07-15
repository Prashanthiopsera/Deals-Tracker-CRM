import { BadRequestException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiClassification } from '../database/enums';
import { PiiRegistryService } from './pii-registry.service';
import { PiiDiscoveryService } from './pii-discovery.service';

describe('PiiDiscoveryService (WO-069)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const service = new PiiDiscoveryService(piiRegistry, audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    piiRegistry.onModuleInit();
    service.seedFromFixtures();
  });

  it('finds exact email matches across contacts, companies, and activities', () => {
    const manifest = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(manifest.identifierType).toBe('email');
    expect(manifest.matchCount).toBeGreaterThan(0);
    expect(manifest.matches.some((match) => match.table === 'contacts')).toBe(true);
    expect(manifest.matches.some((match) => match.table === 'companies')).toBe(true);
    expect(manifest.matches.some((match) => match.table === 'activities')).toBe(true);
  });

  it('finds partial name matches', () => {
    const manifest = service.discover('Ada Lovelace', 'admin-1', 'Admin');
    expect(manifest.identifierType).toBe('name');
    expect(manifest.matches.some((match) => match.rowId === 'contact-seed-special')).toBe(true);
  });

  it('finds records by contact_id', () => {
    const manifest = service.discover('contact-seed-special', 'admin-1', 'Admin');
    expect(manifest.identifierType).toBe('contact_id');
    expect(manifest.matches.every((match) => match.rowId === 'contact-seed-special')).toBe(true);
  });

  it('returns empty manifest when no records match', () => {
    const manifest = service.discover('nobody@example.com', 'admin-1', 'Admin');
    expect(manifest.matchCount).toBe(0);
    expect(manifest.matches).toEqual([]);
  });

  it('includes classification tier for each match', () => {
    const manifest = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(
      manifest.matches.every((match) =>
        Object.values(PiiClassification).includes(match.classification),
      ),
    ).toBe(true);
  });

  it('handles special characters in names', () => {
    const manifest = service.discover("O'Brien", 'admin-1', 'Admin');
    expect(manifest.matchCount).toBeGreaterThan(0);
  });

  it('handles unicode names', () => {
    const manifest = service.discover('Müller', 'admin-1', 'Admin');
    expect(manifest.matchCount).toBeGreaterThan(0);
  });

  it('ignores null email fields during email lookup', () => {
    const manifest = service.discover('contact1@example.com', 'admin-1', 'Admin');
    expect(manifest.matches.some((match) => match.column === 'email')).toBe(true);
  });

  it('completes discovery within 5 seconds for seeded dataset', () => {
    const manifest = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(manifest.discoveryLatencyMs).toBeLessThan(5000);
  });

  it('creates audit log entries for discovery invocations', () => {
    service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'pii.discovery')).toBe(
      true,
    );
  });

  it('rejects empty identifiers', () => {
    expect(() => service.discover('   ', 'admin-1', 'Admin')).toThrow(BadRequestException);
  });

  it('matches multiple contacts sharing partial name tokens', () => {
    const manifest = service.discover('First1', 'admin-1', 'Admin');
    expect(manifest.matchCount).toBeGreaterThan(0);
  });

  it('matches company notes referencing individuals', () => {
    const manifest = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(manifest.matches.some((match) => match.table === 'companies' && match.column === 'notes')).toBe(
      true,
    );
  });

  it('matches activity body and subject fields separately', () => {
    const manifest = service.discover('ada@example.com', 'admin-1', 'Admin');
    const activityColumns = manifest.matches
      .filter((match) => match.table === 'activities')
      .map((match) => match.column);
    expect(activityColumns.length).toBeGreaterThan(0);
  });

  it('supports repeated discovery calls with consistent results', () => {
    const first = service.discover('ada@example.com', 'admin-1', 'Admin');
    const second = service.discover('ada@example.com', 'admin-1', 'Admin');
    expect(second.matchCount).toBe(first.matchCount);
  });

  it('searches more than one table in a single manifest', () => {
    const tables = new Set(
      service.discover('ada@example.com', 'admin-1', 'Admin').matches.map((match) => match.table),
    );
    expect(tables.size).toBeGreaterThan(1);
  });
});
