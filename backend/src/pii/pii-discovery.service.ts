import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PiiClassification } from '../database/enums';
import { PiiRegistryService } from '../pii/pii-registry.service';
import {
  DiscoveryActivityRecord,
  DiscoveryCompanyRecord,
  DiscoveryContactRecord,
  piiDiscoverySeedData,
} from '../../test-fixtures/pii/pii-discovery.fixture';

export interface PiiDiscoveryMatch {
  table: string;
  rowId: string;
  column: string;
  classification: PiiClassification;
}

export interface PiiDiscoveryManifest {
  subjectIdentifier: string;
  identifierType: 'email' | 'name' | 'contact_id';
  matches: PiiDiscoveryMatch[];
  matchCount: number;
  discoveryLatencyMs: number;
}

@Injectable()
export class PiiDiscoveryService {
  private contacts: DiscoveryContactRecord[] = [];
  private companies: DiscoveryCompanyRecord[] = [];
  private activities: DiscoveryActivityRecord[] = [];

  constructor(
    private readonly piiRegistry: PiiRegistryService,
    private readonly audit: AuditService,
  ) {
    this.seedFromFixtures();
  }

  seedFromFixtures(): void {
    const seed = piiDiscoverySeedData;
    this.contacts = seed.contacts.map((row) => ({
      ...row,
      piiTags: { ...row.piiTags },
    }));
    this.companies = seed.companies.map((row) => ({ ...row }));
    this.activities = seed.activities.map((row) => ({
      ...row,
      metadata: { ...row.metadata },
    }));
  }

  discover(
    identifier: string,
    actorId: string,
    actorRole: string,
  ): PiiDiscoveryManifest {
    const started = performance.now();
    const normalized = identifier.trim();
    if (!normalized) {
      throw new BadRequestException('A data subject identifier is required');
    }

    const identifierType = this.resolveIdentifierType(normalized);
    const matches = this.locateMatches(normalized, identifierType);
    const manifest: PiiDiscoveryManifest = {
      subjectIdentifier: normalized,
      identifierType,
      matches,
      matchCount: matches.length,
      discoveryLatencyMs: performance.now() - started,
    };

    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'create',
      resourceType: 'PiiDiscovery',
      resourceId: actorId,
      afterState: {
        subjectIdentifier: normalized,
        identifierType,
        matchCount: matches.length,
      },
      metadata: {
        action: 'pii.discovery',
        subject_identifier: normalized,
        discovery_latency_ms: manifest.discoveryLatencyMs,
      },
    });

    return manifest;
  }

  private resolveIdentifierType(identifier: string): 'email' | 'name' | 'contact_id' {
    if (identifier.includes('@')) return 'email';
    if (identifier.startsWith('contact-')) return 'contact_id';
    return 'name';
  }

  private locateMatches(
    identifier: string,
    identifierType: 'email' | 'name' | 'contact_id',
  ): PiiDiscoveryMatch[] {
    const matches: PiiDiscoveryMatch[] = [];
    const needle = identifier.toLowerCase();

    for (const contact of this.contacts) {
      if (identifierType === 'contact_id' && contact.id !== identifier) continue;
      if (identifierType === 'email' && contact.email?.toLowerCase() !== needle) continue;
      if (
        identifierType === 'name' &&
        !`${contact.firstName} ${contact.lastName}`.toLowerCase().includes(needle)
      ) {
        continue;
      }

      for (const [column, tag] of Object.entries(contact.piiTags)) {
        const value = contact[column as keyof DiscoveryContactRecord];
        if (value === null || value === undefined || typeof value === 'object') continue;
        matches.push({
          table: 'contacts',
          rowId: contact.id,
          column,
          classification: tag.classification,
        });
      }
    }

    for (const company of this.companies) {
      if (!company.notes?.toLowerCase().includes(needle)) continue;
      matches.push({
        table: 'companies',
        rowId: company.id,
        column: 'notes',
        classification:
          this.piiRegistry.getPiiFieldsForEntity('Company').notes ??
          PiiClassification.CONFIDENTIAL,
      });
    }

    for (const activity of this.activities) {
      const haystack = JSON.stringify({
        subject: activity.subject,
        body: activity.body,
        metadata: activity.metadata,
      }).toLowerCase();
      if (!haystack.includes(needle)) continue;
      if (activity.subject?.toLowerCase().includes(needle)) {
        matches.push({
          table: 'activities',
          rowId: activity.id,
          column: 'subject',
          classification: PiiClassification.INTERNAL,
        });
      }
      if (activity.body?.toLowerCase().includes(needle)) {
        matches.push({
          table: 'activities',
          rowId: activity.id,
          column: 'body',
          classification: PiiClassification.INTERNAL,
        });
      }
    }

    return matches;
  }
}
