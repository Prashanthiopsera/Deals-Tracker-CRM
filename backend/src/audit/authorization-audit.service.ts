import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CedarAuthDecision, CedarAuthRequest } from '../authorization/cedar.types';
import { AuditAction } from '../database/enums';
import { AuthorizationAuditEvent, AuthorizationSource } from './authorization-audit.types';
import { AuthorizationMetricsPublisher } from './authorization-audit.metrics';
import { AuditQueuePublisher } from './authorization-audit.publisher';
import { AuditLogRepository } from './audit-log.repository';

@Injectable()
export class AuthorizationAuditConsumer {
  constructor(private readonly repository: AuditLogRepository) {}

  async persist(event: AuthorizationAuditEvent): Promise<void> {
    await this.repository.insert({
      actorId: event.actorId,
      actorRole: event.actorRole,
      action: event.decision === 'deny' ? AuditAction.PERMISSION_DENIED : AuditAction.UPDATE,
      entityType: event.resourceType,
      entityId: event.resourceId ?? '00000000-0000-0000-0000-000000000000',
      beforeState: null,
      afterState: {
        decision: event.decision,
        cedar_action: event.action,
      },
      metadata: {
        cedar_policy_id: event.cedarPolicyId,
        source: event.source,
        request_metadata: event.requestMetadata ?? {},
        event_id: event.eventId,
      },
      timestamp: new Date(event.timestamp),
    });
  }
}

@Injectable()
export class AuthorizationAuditService {
  constructor(
    private readonly publisher: AuditQueuePublisher,
    private readonly consumer: AuthorizationAuditConsumer,
    private readonly metrics: AuthorizationMetricsPublisher,
  ) {}

  buildEvent(
    request: CedarAuthRequest,
    decision: CedarAuthDecision,
    source: AuthorizationSource = 'api',
    requestMetadata?: Record<string, unknown>,
  ): AuthorizationAuditEvent {
    return {
      eventId: randomUUID(),
      actorId: request.userId,
      actorRole: request.role,
      action: request.action,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      decision: decision.allowed ? 'allow' : 'deny',
      cedarPolicyId: decision.policyId,
      source,
      timestamp: new Date().toISOString(),
      requestMetadata,
    };
  }

  publishDecisionAsync(
    request: CedarAuthRequest,
    decision: CedarAuthDecision,
    source: AuthorizationSource = 'api',
    requestMetadata?: Record<string, unknown>,
  ): void {
    const event = this.buildEvent(request, decision, source, requestMetadata);
    void this.publisher.publish(event).catch(() => undefined);
    void this.metrics.recordDecision(event).catch(() => undefined);
  }

  async processQueuedEvent(event: AuthorizationAuditEvent): Promise<void> {
    await this.consumer.persist(event);
  }
}
