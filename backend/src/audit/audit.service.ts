import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditEventQuery, DomainAuditEvent } from './audit-log.types';
import { AuditLogConsumer } from './audit-log.consumer';
import { AuditLogRepository } from './audit-log.repository';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';

@Injectable()
export class AuditService {
  constructor(
    private readonly queue: InMemoryAuditQueuePublisher,
    private readonly consumer: AuditLogConsumer,
    private readonly repository: AuditLogRepository,
  ) {}

  publishAuditEvent(
    input: Omit<DomainAuditEvent, 'eventId' | 'timestamp'> & { eventId?: string; timestamp?: string },
  ): void {
    const event: DomainAuditEvent = {
      eventId: input.eventId ?? randomUUID(),
      timestamp: input.timestamp ?? new Date().toISOString(),
      actorId: input.actorId,
      actorRole: input.actorRole,
      operation: input.operation,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      beforeState: input.beforeState,
      afterState: input.afterState,
      affectedFields: input.affectedFields,
      correlationId: input.correlationId ?? randomUUID(),
      metadata: input.metadata,
    };
    void this.queue.publishDomainEvent(event);
  }

  async processAuditEvent(event: DomainAuditEvent): Promise<void> {
    await this.consumer.persist(event);
  }

  async queryAuditEvents(filters: AuditEventQuery) {
    return this.repository.query(filters);
  }
}
