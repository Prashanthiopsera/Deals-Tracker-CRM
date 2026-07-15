import { Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogRepository } from './audit-log.repository';
import { InMemoryAuditCompletenessMetrics } from './audit-completeness.metrics';

export interface ReconciliationResult {
  emitted: number;
  persisted: number;
  driftPercent: number;
  withinThreshold: boolean;
}

@Injectable()
export class AuditReconciliationService {
  constructor(
    private readonly metrics: InMemoryAuditCompletenessMetrics,
    private readonly repository: AuditLogRepository,
    private readonly audit: AuditService,
  ) {}

  async reconcile(thresholdPercent = 1): Promise<ReconciliationResult> {
    const emitted = [...this.metrics.emitted.values()].reduce((sum, value) => sum + value, 0);
    const persisted = await this.repository.count();
    const driftPercent =
      emitted === 0 ? 0 : Math.abs(((emitted - persisted) / emitted) * 100);
    const result: ReconciliationResult = {
      emitted,
      persisted,
      driftPercent,
      withinThreshold: driftPercent <= thresholdPercent,
    };

    this.audit.publishAuditEvent({
      actorId: '00000000-0000-0000-0000-000000000001',
      actorRole: 'system',
      operation: 'update',
      resourceType: 'AuditLog',
      resourceId: '00000000-0000-0000-0000-000000000002',
      metadata: {
        reconciliation: result,
        job: 'audit_reconciliation_hourly',
      },
    });

    return result;
  }
}
