import { BadRequestException } from '@nestjs/common';
import { CompanyOwnershipService } from './company-ownership.service';

describe('CompanyOwnershipService (WO-043)', () => {
  const users = { findOne: jest.fn() };
  const service = new CompanyOwnershipService(users as never);

  beforeEach(() => {
    users.findOne.mockReset();
    delete process.env.COMPANIES_IN_MEMORY;
  });

  it('rejects invalid UUIDs in in-memory mode', async () => {
    process.env.COMPANIES_IN_MEMORY = 'true';
    await expect(
      service.validateTargets({ deal_lead_user_id: 'not-a-uuid' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown users in database mode', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(
      service.validateTargets({ deal_lead_user_id: '88888888-8888-8888-8888-888888888888' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts existing users in database mode', async () => {
    users.findOne.mockResolvedValue({ id: '88888888-8888-8888-8888-888888888888' });
    await expect(
      service.validateTargets({ deal_lead_user_id: '88888888-8888-8888-8888-888888888888' }),
    ).resolves.toBeUndefined();
  });
});
