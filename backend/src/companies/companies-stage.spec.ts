import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { DealStage } from '../database/enums';
import { CompaniesInMemoryService } from './companies-in-memory.service';
import { SqsCompanyAuditPublisher } from './companies.service';

describe('stage transition service (WO-042)', () => {
  const service = new CompaniesInMemoryService(
    new SqsCompanyAuditPublisher(new InMemoryAuditQueuePublisher()),
  );

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
