import { VerifiedPermissionsClient, buildAuthRequest } from '../authorization/cedar.service';
import { createCompanyAuditPublisher } from './companies-audit.test-utils';
import { CompaniesInMemoryService } from './companies-in-memory.service';

describe('director-only company deletion (WO-041)', () => {
  const { queue, publisher } = createCompanyAuditPublisher();
  const service = new CompaniesInMemoryService(publisher);
  const cedar = new VerifiedPermissionsClient();

  beforeEach(() => {
    queue.domainMessages.length = 0;
    service.resetToSeed();
    process.env.CEDAR_BYPASS = 'false';
  });

  it('soft deletes for director with full before-state audit payload', async () => {
    await service.softDelete(
      '11111111-1111-1111-1111-111111111111',
      'director-1',
      'Director',
    );
    expect(queue.domainMessages[0].beforeState).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
    });
    await expect(service.getById('11111111-1111-1111-1111-111111111111')).rejects.toThrow();
  });

  it('denies principal delete via Cedar matrix', async () => {
    const decision = await cedar.isAuthorized(
      buildAuthRequest(
        { p7vcUserId: 'principal-1', p7vcRole: 'Principal' },
        'delete',
        'Company',
        '11111111-1111-1111-1111-111111111111',
      ),
    );
    expect(decision.allowed).toBe(false);
  });

  it('denies associate and intern delete via Cedar matrix', async () => {
    for (const role of ['Associate', 'Intern']) {
      const decision = await cedar.isAuthorized(
        buildAuthRequest(
          { p7vcUserId: `${role.toLowerCase()}-1`, p7vcRole: role },
          'delete',
          'Company',
          '11111111-1111-1111-1111-111111111111',
        ),
      );
      expect(decision.allowed).toBe(false);
    }
  });
});
