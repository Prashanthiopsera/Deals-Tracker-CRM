import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ErasureService } from './erasure.service';
import {
  buildRetentionSeedRecords,
  defaultRetentionPolicies,
  RetentionDataCategory,
  RetentionExpiryAction,
  RetentionPolicyRecord,
  RetentionSeedRecord,
} from '../../test-fixtures/compliance/retention.fixture';

export interface RetentionMetricsPublisher {
  publishPurgeMetrics(metrics: {
    recordsPurged: number;
    recordsFailed: number;
    purgeDurationMs: number;
  }): void;
}

export class InMemoryRetentionMetricsPublisher implements RetentionMetricsPublisher {
  readonly samples: Array<{
    recordsPurged: number;
    recordsFailed: number;
    purgeDurationMs: number;
  }> = [];

  publishPurgeMetrics(metrics: {
    recordsPurged: number;
    recordsFailed: number;
    purgeDurationMs: number;
  }): void {
    this.samples.push(metrics);
  }
}

export interface PurgeRunSummary {
  evaluated: number;
  purged: number;
  failed: number;
  durationMs: number;
  errors: string[];
}

@Injectable()
export class RetentionPolicyService {
  private policies = new Map<string, RetentionPolicyRecord>(
    defaultRetentionPolicies.map((policy) => [policy.id, { ...policy }]),
  );
  private records: RetentionSeedRecord[] = buildRetentionSeedRecords();

  constructor(
    private readonly audit: AuditService,
    private readonly erasure: ErasureService,
    private readonly metrics: RetentionMetricsPublisher,
  ) {}

  seedRecords(records: RetentionSeedRecord[]): void {
    this.records = records.map((record) => ({ ...record }));
  }

  list(actorRole: string): RetentionPolicyRecord[] {
    this.assertAdmin(actorRole);
    return [...this.policies.values()].map((policy) => ({ ...policy }));
  }

  create(
    input: Omit<RetentionPolicyRecord, 'id'>,
    actorId: string,
    actorRole: string,
  ): RetentionPolicyRecord {
    this.assertAdmin(actorRole);
    this.validatePolicy(input);
    const policy: RetentionPolicyRecord = { ...input, id: randomUUID() };
    this.policies.set(policy.id, policy);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'create',
      resourceType: 'RetentionPolicy',
      resourceId: policy.id,
      afterState: policy as unknown as Record<string, unknown>,
      metadata: { action: 'retention.policy_create' },
    });
    return { ...policy };
  }

  update(
    id: string,
    input: Partial<Omit<RetentionPolicyRecord, 'id'>>,
    actorId: string,
    actorRole: string,
  ): RetentionPolicyRecord {
    this.assertAdmin(actorRole);
    const policy = this.requirePolicy(id);
    const next = { ...policy, ...input };
    this.validatePolicy(next);
    this.policies.set(id, next);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'RetentionPolicy',
      resourceId: id,
      beforeState: policy as unknown as Record<string, unknown>,
      afterState: next as unknown as Record<string, unknown>,
      metadata: { action: 'retention.policy_update' },
    });
    return { ...next };
  }

  get(id: string, actorRole: string): RetentionPolicyRecord {
    this.assertAdmin(actorRole);
    return { ...this.requirePolicy(id) };
  }

  async runPurge(
    dataCategory: RetentionDataCategory,
    actorId: string,
    actorRole: string,
  ): Promise<PurgeRunSummary> {
    this.assertAdmin(actorRole);
    const started = performance.now();
    const policy = [...this.policies.values()].find((item) => item.dataCategory === dataCategory);
    if (!policy) {
      throw new NotFoundException(`No retention policy configured for ${dataCategory}`);
    }

    const expired = this.records
      .filter((record) => record.dataCategory === dataCategory)
      .filter((record) => this.isExpired(record.createdAt, policy.retentionPeriodDays))
      .slice(0, policy.batchSize);

    let purged = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of expired) {
      try {
        if (dataCategory === 'contacts' && policy.actionOnExpiry === 'anonymize' && record.subjectIdentifier) {
          await this.erasure.createRequest(record.subjectIdentifier, actorId, actorRole);
        } else {
          this.records = this.records.filter((item) => item.id !== record.id);
        }
        purged += 1;
      } catch (error) {
        failed += 1;
        errors.push(error instanceof Error ? error.message : 'Unknown purge error');
      }
    }

    const summary: PurgeRunSummary = {
      evaluated: expired.length,
      purged,
      failed,
      durationMs: performance.now() - started,
      errors,
    };

    this.metrics.publishPurgeMetrics({
      recordsPurged: purged,
      recordsFailed: failed,
      purgeDurationMs: summary.durationMs,
    });
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'delete',
      resourceType: 'RetentionPolicy',
      resourceId: policy.id,
      afterState: summary as unknown as Record<string, unknown>,
      metadata: { action: 'retention.purge_run', dataCategory },
    });

    return summary;
  }

  private isExpired(createdAt: string, retentionPeriodDays: number): boolean {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    return ageMs > retentionPeriodDays * 24 * 60 * 60 * 1000;
  }

  private validatePolicy(
    policy: Pick<RetentionPolicyRecord, 'dataCategory' | 'retentionPeriodDays'>,
  ): void {
    if (policy.dataCategory === 'audit_logs' && policy.retentionPeriodDays < 365) {
      throw new BadRequestException('Audit log retention must be at least 365 days');
    }
  }

  private requirePolicy(id: string): RetentionPolicyRecord {
    const policy = this.policies.get(id);
    if (!policy) {
      throw new NotFoundException(`Retention policy ${id} was not found`);
    }
    return policy;
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}
