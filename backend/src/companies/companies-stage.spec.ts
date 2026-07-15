import { DealStage } from '../database/enums';
import { createCompanyAuditPublisher } from './companies-audit.test-utils';
import { CompaniesInMemoryService } from './companies-in-memory.service';

describe('stage transition service (WO-042)', () => {
  const { publisher } = createCompanyAuditPublisher();
  const service = new CompaniesInMemoryService(publisher);

  beforeEach(() => service.resetToSeed());

  it('transitions stage and records key date', async () => {
    const updated = await service.transitionStage(
      '11111111-1111-1111-1111-111111111111',
      DealStage.SCREENING,
      'associate-1',
      'Associate',
    );
    expect(updated.deal_stage).toBe(DealStage.SCREENING);
    expect(updated.key_dates).toHaveProperty('screening_entered_at');
  });
});
