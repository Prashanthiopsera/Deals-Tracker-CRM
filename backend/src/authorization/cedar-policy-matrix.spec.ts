import { VerifiedPermissionsClient, buildAuthRequest } from './cedar.service';

describe('Cedar policy matrix (WO-045)', () => {
  const cedar = new VerifiedPermissionsClient();

  beforeEach(() => {
    process.env.CEDAR_BYPASS = 'false';
  });

  it('permits director and principal reassign on Company', async () => {
    for (const role of ['Director', 'Principal']) {
      const decision = await cedar.isAuthorized(
        buildAuthRequest(
          { p7vcUserId: `${role.toLowerCase()}-1`, p7vcRole: role },
          'reassign',
          'Company',
          '11111111-1111-1111-1111-111111111111',
        ),
      );
      expect(decision.allowed).toBe(true);
    }
  });

  it('denies associate and intern reassign on Company', async () => {
    for (const role of ['Associate', 'Intern']) {
      const decision = await cedar.isAuthorized(
        buildAuthRequest(
          { p7vcUserId: `${role.toLowerCase()}-1`, p7vcRole: role },
          'reassign',
          'Company',
          '11111111-1111-1111-1111-111111111111',
        ),
      );
      expect(decision.allowed).toBe(false);
    }
  });

  it('permits associate stage_transition and denies intern', async () => {
    const associate = await cedar.isAuthorized(
      buildAuthRequest(
        { p7vcUserId: 'associate-1', p7vcRole: 'Associate' },
        'stage_transition',
        'Company',
        '11111111-1111-1111-1111-111111111111',
      ),
    );
    expect(associate.allowed).toBe(true);

    const intern = await cedar.isAuthorized(
      buildAuthRequest(
        { p7vcUserId: 'intern-1', p7vcRole: 'Intern' },
        'stage_transition',
        'Company',
        '11111111-1111-1111-1111-111111111111',
      ),
    );
    expect(intern.allowed).toBe(false);
  });
});
