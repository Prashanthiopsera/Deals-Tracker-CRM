import { VerifiedPermissionsClient, buildAuthRequest } from '../authorization/cedar.service';

describe('role-gated company creation (WO-047)', () => {
  const cedar = new VerifiedPermissionsClient();

  beforeEach(() => {
    process.env.CEDAR_BYPASS = 'false';
  });

  it('permits director, principal, and associate create', async () => {
    for (const role of ['Director', 'Principal', 'Associate']) {
      const decision = await cedar.isAuthorized(
        buildAuthRequest({ p7vcUserId: `${role.toLowerCase()}-1`, p7vcRole: role }, 'create', 'Company'),
      );
      expect(decision.allowed).toBe(true);
    }
  });

  it('denies intern create', async () => {
    const decision = await cedar.isAuthorized(
      buildAuthRequest({ p7vcUserId: 'intern-1', p7vcRole: 'Intern' }, 'create', 'Company'),
    );
    expect(decision.allowed).toBe(false);
  });
});
