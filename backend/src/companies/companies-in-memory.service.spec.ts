import { CompaniesInMemoryService } from './companies-in-memory.service';
import { createCompanyAuditPublisher } from './companies-audit.test-utils';
import { DealStage } from '../database/enums';

describe('CompaniesInMemoryService (WO-010)', () => {
  const { publisher } = createCompanyAuditPublisher();
  const service = new CompaniesInMemoryService(publisher);

  beforeEach(() => {
    service.resetToSeed();
  });

  it('creates, lists, patches, and soft-deletes companies', async () => {
    const created = await service.create(
      { company_name: 'NewCo', deal_stage: DealStage.SOURCED },
      'actor-1',
      'Director',
    );
    expect(created.name).toBe('NewCo');
    const companyId = String(created.id);

    const list = await service.list({ limit: 10 });
    expect(list.items.length).toBeGreaterThan(1);

    const patched = await service.patch(
      companyId,
      { notes: 'Updated' },
      'actor-1',
      'Director',
    );
    expect(patched.notes).toBe('Updated');

    await service.softDelete(companyId, 'actor-1', 'Director');
    await expect(service.getById(companyId)).rejects.toThrow();
  });
});
