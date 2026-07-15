import { createCompanyAuditPublisher } from './companies-audit.test-utils';
import { CompaniesInMemoryService } from './companies-in-memory.service';

describe('ownership reassignment (WO-043)', () => {
  const { queue, publisher } = createCompanyAuditPublisher();
  const service = new CompaniesInMemoryService(publisher);

  beforeEach(() => {
    queue.domainMessages.length = 0;
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
    expect(queue.domainMessages[0].operation).toBe('ownership_reassignment');
  });
});
