import { createAuditTestStack } from '../audit/audit-test.utils';
import { SqsCompanyAuditPublisher } from './companies.service';

export function createCompanyAuditPublisher() {
  const { queue, repository, service: auditService } = createAuditTestStack();
  return {
    queue,
    repository,
    auditService,
    publisher: new SqsCompanyAuditPublisher(auditService),
  };
}
