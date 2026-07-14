import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InMemoryCedarCache } from './cedar-cache';
import { CedarGuard } from './cedar.guard';
import { CedarAuthorizationService, VerifiedPermissionsClient } from './cedar.service';
import { CedarAuthRequest, CedarPolicyClient } from './cedar.types';
import roleTokens from '../../test-fixtures/auth/role-tokens.json';

function buildContext(
  overrides: {
    user?: { p7vcUserId: string; p7vcRole: string; p7vcTeamId?: string };
    method?: string;
    path?: string;
    params?: { id?: string };
    handlerMeta?: { action: string; resourceType: string };
    isPublic?: boolean;
  } = {},
): ExecutionContext {
  const request = {
    user: overrides.user,
    method: overrides.method ?? 'GET',
    path: overrides.path ?? '/api/companies',
    route: { path: overrides.path ?? '/api/companies' },
    params: overrides.params ?? {},
  };

  function handler() {
    return undefined;
  }

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => handler,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('CedarGuard', () => {
  const reflector = new Reflector();
  let guard: CedarGuard;
  let service: CedarAuthorizationService;

  beforeEach(() => {
    process.env.CEDAR_BYPASS = 'false';
    service = new CedarAuthorizationService(
      new VerifiedPermissionsClient(),
      new InMemoryCedarCache(),
    );
    guard = new CedarGuard(reflector, service);
  });

  it('allows public routes without user', async () => {
    const context = buildContext({ isPublic: true, path: '/api/companies' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('skips health endpoints', async () => {
    const context = buildContext({ path: '/api/health' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('requires authentication for protected routes', async () => {
    const context = buildContext({ path: '/api/companies' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('permits director delete on companies', async () => {
    const director = roleTokens.find((t) => t.role === 'Director')!;
    const context = buildContext({
      user: {
        p7vcUserId: director.userId,
        p7vcRole: director.role,
        p7vcTeamId: director.teamId,
      },
      method: 'DELETE',
      path: '/api/companies/c1',
      params: { id: 'c1' },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies intern delete with structured 403', async () => {
    const intern = roleTokens.find((t) => t.role === 'Intern')!;
    const context = buildContext({
      user: {
        p7vcUserId: intern.userId,
        p7vcRole: intern.role,
      },
      method: 'DELETE',
      path: '/api/companies/c1',
      params: { id: 'c1' },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: { message: 'You do not have permission to perform this action' },
    });
  });

  it('denies associate reassign', async () => {
    const associate = roleTokens.find((t) => t.role === 'Associate')!;
    const context = buildContext({
      user: { p7vcUserId: associate.userId, p7vcRole: associate.role },
      method: 'PATCH',
      path: '/api/companies/c1/owner',
      params: { id: 'c1' },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('permits principal reassign', async () => {
    const principal = roleTokens.find((t) => t.role === 'Principal')!;
    const context = buildContext({
      user: { p7vcUserId: principal.userId, p7vcRole: principal.role },
      method: 'PATCH',
      path: '/api/companies/c1/owner',
      params: { id: 'c1' },
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies intern create', async () => {
    const intern = roleTokens.find((t) => t.role === 'Intern')!;
    const context = buildContext({
      user: { p7vcUserId: intern.userId, p7vcRole: intern.role },
      method: 'POST',
      path: '/api/companies',
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('uses handler metadata when present', async () => {
    const intern = roleTokens.find((t) => t.role === 'Intern')!;
    const context = buildContext({
      user: { p7vcUserId: intern.userId, p7vcRole: intern.role },
      method: 'GET',
      path: '/api/admin/users',
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue({ action: 'read', resourceType: 'User' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('returns cached decision without re-evaluating client', async () => {
    const calls: CedarAuthRequest[] = [];
    const mockClient: CedarPolicyClient = {
      isAuthorized: jest.fn(async (request) => {
        calls.push(request);
        return { allowed: true, policyId: 'mock', cached: false, latencyMs: 1 };
      }),
    };
    const cache = new InMemoryCedarCache();
    const cachedGuard = new CedarGuard(
      reflector,
      new CedarAuthorizationService(mockClient, cache),
    );
    const director = roleTokens.find((t) => t.role === 'Director')!;
    const context = buildContext({
      user: { p7vcUserId: director.userId, p7vcRole: director.role },
      method: 'GET',
      path: '/api/companies',
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    await cachedGuard.canActivate(context);
    await cachedGuard.canActivate(context);

    expect(mockClient.isAuthorized).toHaveBeenCalledTimes(1);
  });

  it('propagates authorization service failures', async () => {
    const failingClient: CedarPolicyClient = {
      isAuthorized: jest.fn(async () => {
        throw new Error('AVP unavailable');
      }),
    };
    const failingGuard = new CedarGuard(
      reflector,
      new CedarAuthorizationService(failingClient, new InMemoryCedarCache()),
    );
    const director = roleTokens.find((t) => t.role === 'Director')!;
    const context = buildContext({
      user: { p7vcUserId: director.userId, p7vcRole: director.role },
      method: 'GET',
      path: '/api/companies',
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    await expect(failingGuard.canActivate(context)).rejects.toThrow('AVP unavailable');
  });
});
