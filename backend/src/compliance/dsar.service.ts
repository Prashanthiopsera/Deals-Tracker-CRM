import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PiiDiscoveryManifest, PiiDiscoveryService } from '../pii/pii-discovery.service';
import {
  buildDsarExportCsv,
  DsarLifecycleStatus,
} from '../../test-fixtures/compliance/dsar.fixture';

export interface DsarExportStore {
  putEncryptedObject(
    key: string,
    body: string,
  ): Promise<{ key: string; kmsKeyId: string; presignedUrl: string }>;
}

export class InMemoryDsarExportStore implements DsarExportStore {
  readonly objects = new Map<string, string>();

  async putEncryptedObject(
    key: string,
    body: string,
  ): Promise<{ key: string; kmsKeyId: string; presignedUrl: string }> {
    this.objects.set(key, body);
    return {
      key,
      kmsKeyId: 'alias/dsar-export',
      presignedUrl: `https://s3.example.com/${key}?expires=72h`,
    };
  }
}

export interface WorkflowTopicPublisher {
  publishSlaAlert(payload: Record<string, unknown>): Promise<void>;
}

export class InMemoryWorkflowTopicPublisher implements WorkflowTopicPublisher {
  readonly alerts: Record<string, unknown>[] = [];

  async publishSlaAlert(payload: Record<string, unknown>): Promise<void> {
    this.alerts.push(payload);
  }
}

export interface DsarRequestRecord {
  id: string;
  subjectIdentifier: string;
  status: DsarLifecycleStatus;
  manifest: PiiDiscoveryManifest | null;
  exportJsonKey: string | null;
  exportCsvKey: string | null;
  presignedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  slaBreached: boolean;
}

@Injectable()
export class DsarService {
  private readonly requests = new Map<string, DsarRequestRecord>();
  private readonly slaHours = 48;

  constructor(
    private readonly discovery: PiiDiscoveryService,
    private readonly audit: AuditService,
    private readonly exportStore: DsarExportStore,
    private readonly workflowTopic: WorkflowTopicPublisher,
  ) {}

  createRequest(
    subjectIdentifier: string,
    actorId: string,
    actorRole: string,
  ): DsarRequestRecord {
    this.assertAdmin(actorRole);
    const normalized = subjectIdentifier.trim();
    if (!normalized) {
      throw new BadRequestException('A data subject identifier is required');
    }

    const now = new Date().toISOString();
    const request: DsarRequestRecord = {
      id: randomUUID(),
      subjectIdentifier: normalized,
      status: 'RECEIVED',
      manifest: null,
      exportJsonKey: null,
      exportCsvKey: null,
      presignedUrl: null,
      createdAt: now,
      updatedAt: now,
      slaBreached: false,
    };
    this.requests.set(request.id, request);
    this.transition(request, 'DISCOVERY_IN_PROGRESS', actorId, actorRole);

    const manifest = this.discovery.discover(normalized, actorId, actorRole);
    request.manifest = manifest;
    this.transition(request, 'DISCOVERY_COMPLETE', actorId, actorRole);

    if (manifest.matchCount === 0) {
      throw new NotFoundException(`No PII records found for subject ${normalized}`);
    }

    return this.getRequest(request.id, actorRole);
  }

  async generateExport(requestId: string, actorId: string, actorRole: string) {
    this.assertAdmin(actorRole);
    const request = this.requireRequest(requestId);
    if (!request.manifest) {
      throw new BadRequestException('Discovery must complete before export generation');
    }

    const jsonKey = `dsar/${request.id}/export.json`;
    const csvKey = `dsar/${request.id}/export.csv`;
    const jsonUpload = await this.exportStore.putEncryptedObject(
      jsonKey,
      JSON.stringify(request.manifest, null, 2),
    );
    await this.exportStore.putEncryptedObject(csvKey, buildDsarExportCsv(request.manifest));

    request.exportJsonKey = jsonUpload.key;
    request.exportCsvKey = csvKey;
    request.presignedUrl = jsonUpload.presignedUrl;
    this.transition(request, 'EXPORT_GENERATED', actorId, actorRole);
    this.transition(request, 'DELIVERED', actorId, actorRole);
    this.transition(request, 'CLOSED', actorId, actorRole);

    return {
      requestId: request.id,
      status: request.status,
      jsonKey: jsonUpload.key,
      csvKey,
      presignedUrl: jsonUpload.presignedUrl,
      kmsKeyId: jsonUpload.kmsKeyId,
    };
  }

  evaluateSla(requestId: string, actorRole: string): { requestId: string; slaBreached: boolean } {
    this.assertAdmin(actorRole);
    const request = this.requireRequest(requestId);
    const ageHours =
      (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60);
    if (
      ageHours >= this.slaHours &&
      request.status !== 'EXPORT_GENERATED' &&
      request.status !== 'DELIVERED' &&
      request.status !== 'CLOSED'
    ) {
      request.slaBreached = true;
      void this.workflowTopic.publishSlaAlert({
        requestId: request.id,
        subjectIdentifier: request.subjectIdentifier,
        status: request.status,
        ageHours,
      });
    }
    return { requestId: request.id, slaBreached: request.slaBreached };
  }

  getRequest(requestId: string, actorRole: string): DsarRequestRecord {
    this.assertAdmin(actorRole);
    return { ...this.requireRequest(requestId) };
  }

  private transition(
    request: DsarRequestRecord,
    status: DsarLifecycleStatus,
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
      resourceType: 'DsarRequest',
      resourceId: request.id,
      beforeState: { status: before },
      afterState: { status },
      metadata: { action: 'dsar.status_transition', subjectIdentifier: request.subjectIdentifier },
    });
  }

  private requireRequest(requestId: string): DsarRequestRecord {
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
