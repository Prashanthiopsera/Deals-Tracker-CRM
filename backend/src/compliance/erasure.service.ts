import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PiiDiscoveryManifest, PiiDiscoveryService } from '../pii/pii-discovery.service';
import { ErasureLifecycleStatus } from '../../test-fixtures/compliance/erasure.fixture';

export interface KmsErasureClient {
  scheduleKeyDeletion(keyArn: string): Promise<{ keyArn: string; deletionDate: string }>;
}

export class InMemoryKmsErasureClient implements KmsErasureClient {
  readonly scheduled: Array<{ keyArn: string; deletionDate: string }> = [];

  async scheduleKeyDeletion(keyArn: string): Promise<{ keyArn: string; deletionDate: string }> {
    const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const record = { keyArn, deletionDate };
    this.scheduled.push(record);
    return record;
  }
}

export interface ErasureRequestRecord {
  id: string;
  subjectIdentifier: string;
  status: ErasureLifecycleStatus;
  preErasureManifest: PiiDiscoveryManifest | null;
  scheduledKeyDeletions: Array<{ keyArn: string; deletionDate: string }>;
  verificationPassed: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ErasureService {
  private readonly requests = new Map<string, ErasureRequestRecord>();
  private readonly redactedFields = new Map<string, string>();

  constructor(
    private readonly discovery: PiiDiscoveryService,
    private readonly audit: AuditService,
    private readonly kms: KmsErasureClient,
  ) {}

  async createRequest(
    subjectIdentifier: string,
    actorId: string,
    actorRole: string,
    options?: { contactDekArn?: string },
  ): Promise<ErasureRequestRecord> {
    this.assertAdmin(actorRole);
    const normalized = subjectIdentifier.trim();
    if (!normalized) {
      throw new BadRequestException('A data subject identifier is required');
    }

    const now = new Date().toISOString();
    const request: ErasureRequestRecord = {
      id: randomUUID(),
      subjectIdentifier: normalized,
      status: 'REQUESTED',
      preErasureManifest: null,
      scheduledKeyDeletions: [],
      verificationPassed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.requests.set(request.id, request);

    const manifest = this.discovery.discover(normalized, actorId, actorRole);
    if (manifest.matchCount === 0) {
      throw new NotFoundException(`No PII records found for subject ${normalized}`);
    }
    request.preErasureManifest = manifest;
    this.transition(request, 'DISCOVERY_COMPLETE', actorId, actorRole);
    this.transition(request, 'ERASURE_IN_PROGRESS', actorId, actorRole);

    this.redactPlaintextMatches(request, actorId, actorRole);
    this.discovery.eraseSubjectData(normalized);

    if (options?.contactDekArn) {
      await this.scheduleCryptographicErasure(request, options.contactDekArn, actorId, actorRole);
    }

    this.transition(request, 'VERIFICATION_PENDING', actorId, actorRole);
    const verification = this.verifyErasure(request, actorId, actorRole);
    request.verificationPassed = verification.complete;
    if (verification.complete) {
      this.transition(request, 'COMPLETE', actorId, actorRole);
    }

    return this.getRequest(request.id, actorRole);
  }

  getRequest(requestId: string, actorRole: string): ErasureRequestRecord {
    this.assertAdmin(actorRole);
    return { ...this.requireRequest(requestId) };
  }

  private redactPlaintextMatches(
    request: ErasureRequestRecord,
    actorId: string,
    actorRole: string,
  ): void {
    const placeholder = `[REDACTED-GDPR-${request.id}]`;
    for (const match of request.preErasureManifest?.matches ?? []) {
      const key = `${match.table}:${match.rowId}:${match.column}`;
      this.redactedFields.set(key, placeholder);
      this.audit.publishAuditEvent({
        actorId,
        actorRole,
        operation: 'delete',
        resourceType: 'ErasureRequest',
        resourceId: request.id,
        afterState: { table: match.table, rowId: match.rowId, column: match.column, placeholder },
        metadata: { action: 'erasure.field_redaction', subjectIdentifier: request.subjectIdentifier },
      });
    }
  }

  private async scheduleCryptographicErasure(
    request: ErasureRequestRecord,
    keyArn: string,
    actorId: string,
    actorRole: string,
  ): Promise<void> {
    const scheduled = await this.kms.scheduleKeyDeletion(keyArn);
    request.scheduledKeyDeletions.push(scheduled);
    this.transition(request, 'KEYS_SCHEDULED_FOR_DELETION', actorId, actorRole);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'delete',
      resourceType: 'ErasureRequest',
      resourceId: request.id,
      afterState: scheduled,
      metadata: { action: 'erasure.kms_schedule', subjectIdentifier: request.subjectIdentifier },
    });
  }

  private verifyErasure(
    request: ErasureRequestRecord,
    actorId: string,
    actorRole: string,
  ): { complete: boolean; remainingMatches: number } {
    const postManifest = this.discovery.discover(request.subjectIdentifier, actorId, actorRole);
    const remainingMatches = postManifest.matchCount;
    const complete = remainingMatches === 0;
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'ErasureRequest',
      resourceId: request.id,
      afterState: { complete, remainingMatches },
      metadata: { action: 'erasure.verification', subjectIdentifier: request.subjectIdentifier },
    });
    return { complete, remainingMatches };
  }

  private transition(
    request: ErasureRequestRecord,
    status: ErasureLifecycleStatus,
    actorId: string,
    actorRole: string,
  ): void {
    const before = request.status;
    request.status = status;
    request.updatedAt = new Date().toISOString();
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'ErasureRequest',
      resourceId: request.id,
      beforeState: { status: before },
      afterState: { status },
      metadata: { action: 'erasure.status_transition', subjectIdentifier: request.subjectIdentifier },
    });
  }

  private requireRequest(requestId: string): ErasureRequestRecord {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new NotFoundException(`Erasure request ${requestId} was not found`);
    }
    return request;
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}
