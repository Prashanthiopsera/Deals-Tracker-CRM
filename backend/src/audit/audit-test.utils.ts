import { InMemoryAuditCompletenessMetrics } from './audit-completeness.metrics';
import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { AuditService } from './audit.service';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';

export function createAuditTestStack() {
  const queue = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const metrics = new InMemoryAuditCompletenessMetrics();
  const consumer = new AuditLogConsumer(repository, metrics);
  const service = new AuditService(queue, consumer, repository, metrics);
  return { queue, repository, metrics, consumer, service };
}
