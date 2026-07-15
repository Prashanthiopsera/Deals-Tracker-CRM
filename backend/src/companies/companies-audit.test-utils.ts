import { AuditLogConsumer } from '../audit/audit-log.consumer';
import { InMemoryAuditLogRepository } from '../audit/audit-log.repository';
import { AuditService } from '../audit/audit.service';
import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { SqsCompanyAuditPublisher } from './companies.service';

export function createCompanyAuditPublisher() {
  const queue = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const consumer = new AuditLogConsumer(repository);
  const auditService = new AuditService(queue, consumer, repository);
  return {
    queue,
    repository,
    auditService,
    publisher: new SqsCompanyAuditPublisher(auditService),
  };
}
