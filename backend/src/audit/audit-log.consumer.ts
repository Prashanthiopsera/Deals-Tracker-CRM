import { Injectable } from '@nestjs/common';
import { AuditAction } from '../database/enums';
import { AuditLog } from '../database/entities/audit-log.entity';
import { DomainAuditEvent } from './audit-log.types';
import { AuditLogRepository } from './audit-log.repository';
import { InMemoryAuditCompletenessMetrics } from './audit-completeness.metrics';

function mapOperation(operation: DomainAuditEvent['operation']): AuditAction {
  switch (operation) {
    case 'create':
      return AuditAction.CREATE;
    case 'update':
      return AuditAction.UPDATE;
    case 'delete':
      return AuditAction.DELETE;
    case 'reassign':
    case 'ownership_reassignment':
      return AuditAction.REASSIGN;
    case 'stage_transition':
      return AuditAction.STAGE_TRANSITION;
    case 'ai_retrieval':
      return AuditAction.AI_RETRIEVAL;
    default:
      return AuditAction.UPDATE;
  }
}

function computeAffectedFields(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): string[] | null {
  if (!before || !after) return null;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [...keys].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  return changed.length ? changed : null;
}

@Injectable()
export class AuditLogConsumer {
  constructor(
    private readonly repository: AuditLogRepository,
    private readonly metrics: InMemoryAuditCompletenessMetrics,
  ) {}

  async persist(event: DomainAuditEvent): Promise<void> {
    const entry: Partial<AuditLog> = {
      actorId: event.actorId,
      actorRole: event.actorRole,
      action: mapOperation(event.operation),
      entityType: event.resourceType,
      entityId: event.resourceId,
      beforeState: event.beforeState ?? null,
      afterState: event.afterState ?? null,
      changedFields: event.affectedFields ?? computeAffectedFields(event.beforeState, event.afterState),
      metadata: {
        event_id: event.eventId,
        correlation_id: event.correlationId,
        ...(event.metadata ?? {}),
      },
      timestamp: new Date(event.timestamp),
    };
    await this.repository.insert(entry);
    await this.metrics.recordPersisted(mapOperation(event.operation));
  }
}
