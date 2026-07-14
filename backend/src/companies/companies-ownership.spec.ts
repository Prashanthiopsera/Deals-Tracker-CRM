import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { CompaniesInMemoryService } from './companies-in-memory.service';
import { SqsCompanyAuditPublisher } from './companies.service';

describe('ownership reassignment (WO-043)', () => {
  const queue = new InMemoryAuditQueuePublisher();
  const audit = new SqsCompanyAuditPublisher(queue);
  const service = new CompaniesInMemoryService(audit);

  beforeEach(() => {
    queue.messages.length = 0;
    service.resetToSeed();
  });

  it('reassigns ownership and publishes audit event', async () => {
    const updated = await service.reassignOwner(
      '11111111-1111-1111-1111-111111111111',
      { deal_lead_user_id: '88888888-8888-8888-8888-888888888888' },
      'director-1',
      'Director',
    );
    expect(updated.deal_lead_id).toBe('88888888-8888-8888-8888-888888888888');
    expect(queue.messages[0].action).toBe('ownership_reassignment');
  });
});
