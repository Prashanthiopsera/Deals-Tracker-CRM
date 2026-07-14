import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CedarAuthDecision, CedarAuthRequest } from '../authorization/cedar.types';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuthorizationAuditEvent, AuthorizationSource } from './authorization-audit.types';
import { AuthorizationMetricsPublisher } from './authorization-audit.metrics';
import { AuditQueuePublisher } from './authorization-audit.publisher';

export interface AuditLogRepository {
  insert(entry: Partial<AuditLog>): Promise<void>;
}

@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepository {
  readonly entries: Partial<AuditLog>[] = [];

  async insert(entry: Partial<AuditLog>): Promise<void> {
    this.entries.push(entry);
  }
}

@Injectable()
export class AuthorizationAuditConsumer {
  constructor(private readonly repository: AuditLogRepository) {}

  async persist(event: AuthorizationAuditEvent): Promise<void> {
    await this.repository.insert({
      actorUserId: event.actorId,
      action: `auth.${event.decision}`,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      metadata: {
        actor_role: event.actorRole,
        cedar_action: event.action,
        decision: event.decision,
        cedar_policy_id: event.cedarPolicyId,
        source: event.source,
        request_metadata: event.requestMetadata ?? {},
        event_id: event.eventId,
        timestamp: event.timestamp,
      },
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
