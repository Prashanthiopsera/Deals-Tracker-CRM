import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { VerifiedPermissionsClient, buildAuthRequest } from '../authorization/cedar.service';
import { CompaniesInMemoryService } from './companies-in-memory.service';
import { SqsCompanyAuditPublisher } from './companies.service';

describe('director-only company deletion (WO-041)', () => {
  const queue = new InMemoryAuditQueuePublisher();
  const audit = new SqsCompanyAuditPublisher(queue);
  const service = new CompaniesInMemoryService(audit);
  const cedar = new VerifiedPermissionsClient();

  beforeEach(() => {
    queue.messages.length = 0;
    service.resetToSeed();
    process.env.CEDAR_BYPASS = 'false';
  });

  it('soft deletes for director with full before-state audit payload', async () => {
    await service.softDelete(
      '11111111-1111-1111-1111-111111111111',
      'director-1',
      'Director',
    );
    expect(queue.messages[0].requestMetadata?.before).toMatchObject({
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
