import { ForbiddenException } from '@nestjs/common';
import {
  CedarAuthorizationService,
  InMemoryCedarCache,
  VerifiedPermissionsClient,
  assertAuthorized,
  buildAuthRequest,
} from './cedar.service';

describe('CedarAuthorizationService', () => {
  const service = new CedarAuthorizationService(
    new VerifiedPermissionsClient(),
    new InMemoryCedarCache(),
  );

  it('permits director delete', async () => {
    process.env.CEDAR_BYPASS = 'false';
    const decision = await service.authorize(
      buildAuthRequest(
        { p7vcUserId: 'u1', p7vcRole: 'Director' },
        'delete',
        'Company',
        'c1',
      ),
    );
    expect(decision.allowed).toBe(true);
  });

  it('denies intern delete', async () => {
    const decision = await service.authorize(
      buildAuthRequest(
        { p7vcUserId: 'u2', p7vcRole: 'Intern' },
        'delete',
        'Company',
        'c1',
      ),
    );
    expect(decision.allowed).toBe(false);
    expect(() => assertAuthorized(decision)).toThrow(ForbiddenException);
  });

  it('uses cache on second request', async () => {
    const cache = new InMemoryCedarCache();
    const svc = new CedarAuthorizationService(new VerifiedPermissionsClient(), cache);
    const request = buildAuthRequest(
      { p7vcUserId: 'u3', p7vcRole: 'Associate' },
      'read',
      'Company',
    );
    const first = await svc.authorize(request);
    const second = await svc.authorize(request);
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
  });
});
