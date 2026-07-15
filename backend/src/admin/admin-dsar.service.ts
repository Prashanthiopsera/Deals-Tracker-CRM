import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PiiRegistryService } from '../pii/pii-registry.service';
import {
  buildDsarFixtures,
  DsarActivityRecord,
  DsarAuditRecord,
  DsarCompanyRecord,
  DsarContactRecord,
} from '../../test-fixtures/dsar/dsar-records.fixture';

export type DsarRequestStatus = 'discovered' | 'exported' | 'erased';

export interface DsarDiscoveryReport {
  subjectEmail: string;
  contacts: DsarContactRecord[];
  companies: DsarCompanyRecord[];
  activities: DsarActivityRecord[];
  auditLogs: DsarAuditRecord[];
  totalRecords: number;
}

export interface DsarRequest {
  id: string;
  subjectEmail: string;
  status: DsarRequestStatus;
  report: DsarDiscoveryReport;
  exportS3Key: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DsarObjectStore {
  putEncryptedObject(key: string, body: string): Promise<{ key: string; kmsKeyId: string }>;
}

export class InMemoryDsarObjectStore implements DsarObjectStore {
  readonly objects = new Map<string, string>();

  async putEncryptedObject(key: string, body: string): Promise<{ key: string; kmsKeyId: string }> {
    this.objects.set(key, body);
    return { key, kmsKeyId: 'alias/dsar-export' };
  }
}

@Injectable()
export class AdminDsarService {
  private readonly salt = process.env.DSAR_ANONYMIZATION_SALT ?? 'p7vc-dsar-salt';
  private contacts: DsarContactRecord[] = [];
  private companies: DsarCompanyRecord[] = [];
  private activities: DsarActivityRecord[] = [];
  private auditLogs: DsarAuditRecord[] = [];
  private readonly requests = new Map<string, DsarRequest>();

  constructor(
    private readonly piiRegistry: PiiRegistryService,
    private readonly audit: AuditService,
    private readonly objectStore: DsarObjectStore,
  ) {
    this.seedFromFixtures();
  }

  seedFromFixtures(): void {
    const fixtures = buildDsarFixtures();
    this.contacts = fixtures.contacts.map((row) => ({ ...row }));
    this.companies = fixtures.companies.map((row) => ({ ...row }));
    this.activities = fixtures.activities.map((row) => ({
      ...row,
      metadata: { ...row.metadata },
    }));
    this.auditLogs = fixtures.auditLogs.map((row) => ({
      ...row,
      metadata: { ...row.metadata },
      beforeState: row.beforeState ? { ...row.beforeState } : null,
      afterState: row.afterState ? { ...row.afterState } : null,
    }));
    this.requests.clear();
  }

  discover(subjectEmail: string, actorId: string, actorRole: string): DsarRequest {
    this.assertAdmin(actorRole);
    const normalized = subjectEmail.trim().toLowerCase();
    if (!normalized.includes('@')) {
      throw new BadRequestException('A valid data subject email is required');
    }

    const report = this.buildDiscoveryReport(normalized);
    const now = new Date().toISOString();
    const request: DsarRequest = {
      id: randomUUID(),
      subjectEmail: normalized,
      status: 'discovered',
      report,
      exportS3Key: null,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.set(request.id, request);

    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'create',
      resourceType: 'DsarRequest',
      resourceId: request.id,
      afterState: { subjectEmail: normalized, affectedRecordCount: report.totalRecords },
      metadata: { action: 'dsar.discover', subjectEmail: normalized },
    });

    return { ...request, report: { ...report } };
  }

  async exportRequest(
    requestId: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ requestId: string; s3Key: string; kmsKeyId: string; recordCount: number }> {
    this.assertAdmin(actorRole);
    const request = this.requireRequest(requestId);
    if (request.status === 'erased') {
      throw new BadRequestException('Cannot export a DSAR request that has already been erased');
    }

    const exportPayload = {
      requestId: request.id,
      subjectEmail: request.subjectEmail,
      generatedAt: new Date().toISOString(),
      piiFieldMap: {
        Contact: this.piiRegistry.getPiiFieldsForEntity('Contact'),
        Company: this.piiRegistry.getPiiFieldsForEntity('Company'),
      },
      records: request.report,
    };
    const s3Key = `dsar/${request.id}/export.json`;
    const upload = await this.objectStore.putEncryptedObject(
      s3Key,
      JSON.stringify(exportPayload, null, 2),
    );

    request.status = 'exported';
    request.exportS3Key = upload.key;
    request.updatedAt = new Date().toISOString();

    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'DsarRequest',
      resourceId: request.id,
      afterState: { s3Key: upload.key, recordCount: request.report.totalRecords },
      metadata: { action: 'dsar.export', subjectEmail: request.subjectEmail },
    });

    return {
      requestId: request.id,
      s3Key: upload.key,
      kmsKeyId: upload.kmsKeyId,
      recordCount: request.report.totalRecords,
    };
  }

  eraseRequest(
    requestId: string,
    actorId: string,
    actorRole: string,
  ): { requestId: string; anonymizedRecordCount: number; erasureMarker: string } {
    this.assertAdmin(actorRole);
    const request = this.requireRequest(requestId);
    const erasureMarker = `erased:${request.id}:${new Date().toISOString()}`;
    let anonymizedRecordCount = 0;

    for (const contact of request.report.contacts) {
      const row = this.contacts.find((item) => item.id === contact.id);
      if (!row) continue;
      row.firstName = this.anonymize(row.firstName);
      row.lastName = this.anonymize(row.lastName);
      row.email = row.email ? this.anonymize(row.email) : null;
      row.phone = row.phone ? this.anonymize(row.phone) : null;
      contact.firstName = row.firstName;
      contact.lastName = row.lastName;
      contact.email = row.email;
      contact.phone = row.phone;
      anonymizedRecordCount += 1;
    }

    for (const company of request.report.companies) {
      const row = this.companies.find((item) => item.id === company.id);
      if (!row?.notes) continue;
      row.notes = this.anonymize(row.notes);
      company.notes = row.notes;
      anonymizedRecordCount += 1;
    }

    for (const activity of request.report.activities) {
      const row = this.activities.find((item) => item.id === activity.id);
      if (!row) continue;
      if (row.subject) row.subject = this.anonymize(row.subject);
      if (row.body) row.body = this.anonymize(row.body);
      row.metadata = this.anonymizeJsonValues(row.metadata);
      activity.subject = row.subject;
      activity.body = row.body;
      activity.metadata = { ...row.metadata };
      anonymizedRecordCount += 1;
    }

    for (const log of request.report.auditLogs) {
      const row = this.auditLogs.find((item) => item.id === log.id);
      if (!row) continue;
      row.metadata = {
        ...row.metadata,
        erasureMarker,
        subjectEmailErased: request.subjectEmail,
      };
      log.metadata = { ...row.metadata };
      anonymizedRecordCount += 1;
    }

    request.status = 'erased';
    request.updatedAt = new Date().toISOString();

    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'delete',
      resourceType: 'DsarRequest',
      resourceId: request.id,
      afterState: { anonymizedRecordCount, erasureMarker },
      metadata: { action: 'dsar.erase', subjectEmail: request.subjectEmail },
    });

    return { requestId: request.id, anonymizedRecordCount, erasureMarker };
  }

  getRequest(requestId: string, actorRole: string): DsarRequest {
    this.assertAdmin(actorRole);
    const request = this.requireRequest(requestId);
    return {
      ...request,
      report: {
        ...request.report,
        contacts: request.report.contacts.map((row) => ({ ...row })),
        companies: request.report.companies.map((row) => ({ ...row })),
        activities: request.report.activities.map((row) => ({
          ...row,
          metadata: { ...row.metadata },
        })),
        auditLogs: request.report.auditLogs.map((row) => ({
          ...row,
          metadata: { ...row.metadata },
        })),
      },
    };
  }

  private buildDiscoveryReport(subjectEmail: string): DsarDiscoveryReport {
    const needle = subjectEmail.toLowerCase();
    const contacts = this.contacts.filter(
      (row) => row.email?.toLowerCase() === needle,
    );
    const companies = this.companies.filter((row) =>
      row.notes?.toLowerCase().includes(needle),
    );
    const activities = this.activities.filter(
      (row) =>
        row.body?.toLowerCase().includes(needle) ||
        row.subject?.toLowerCase().includes(needle) ||
        JSON.stringify(row.metadata).toLowerCase().includes(needle),
    );
    const auditLogs = this.auditLogs.filter((row) =>
      this.recordContainsEmail(row, needle),
    );

    return {
      subjectEmail,
      contacts: contacts.map((row) => ({ ...row })),
      companies: companies.map((row) => ({ ...row })),
      activities: activities.map((row) => ({ ...row, metadata: { ...row.metadata } })),
      auditLogs: auditLogs.map((row) => ({
        ...row,
        metadata: { ...row.metadata },
        beforeState: row.beforeState ? { ...row.beforeState } : null,
        afterState: row.afterState ? { ...row.afterState } : null,
      })),
      totalRecords: contacts.length + companies.length + activities.length + auditLogs.length,
    };
  }

  private recordContainsEmail(row: DsarAuditRecord, needle: string): boolean {
    const haystacks = [
      JSON.stringify(row.metadata ?? {}),
      JSON.stringify(row.beforeState ?? {}),
      JSON.stringify(row.afterState ?? {}),
    ];
    return haystacks.some((value) => value.toLowerCase().includes(needle));
  }

  private anonymize(value: string): string {
    return createHash('sha256').update(`${this.salt}:${value}`).digest('hex').slice(0, 32);
  }

  private anonymizeJsonValues(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        output[key] = this.anonymize(value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  private requireRequest(requestId: string): DsarRequest {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new NotFoundException(`DSAR request ${requestId} was not found`);
    }
    return request;
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}
