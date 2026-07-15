import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  afterEach(() => {
    delete process.env.AUTH_BYPASS;
    jest.clearAllMocks();
  });

  it('allows bypass mode for tests', () => {
    process.env.AUTH_BYPASS = 'true';
    const guard = new JwtAuthGuard(reflector);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/companies' }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('allows public routes and health checks', () => {
    const guard = new JwtAuthGuard(reflector);
    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(true);
    const publicContext = {
      switchToHttp: () => ({ getRequest: () => ({ path: '/api/companies' }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(guard.canActivate(publicContext as never)).toBe(true);

    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(false);
    const healthContext = {
      switchToHttp: () => ({ getRequest: () => ({ path: '/api/health' }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(guard.canActivate(healthContext as never)).toBe(true);
  });

  it('injects test user headers in bypass mode', () => {
    process.env.AUTH_BYPASS = 'true';
    const guard = new JwtAuthGuard(reflector);
    const request: {
      path: string;
      headers: Record<string, string>;
      user?: { p7vcRole: string; p7vcUserId: string };
    } = {
      path: '/api/companies',
      headers: {
        'x-p7vc-test-role': 'Director',
        'x-p7vc-test-user-id': 'user-123',
      },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(guard.canActivate(context as never)).toBe(true);
    expect(request.user).toMatchObject({ p7vcRole: 'Director', p7vcUserId: 'user-123' });
  });

  it('throws when handleRequest receives no user', () => {
    const guard = new JwtAuthGuard(reflector);
    expect(() => guard.handleRequest(null, undefined)).toThrow(UnauthorizedException);
  });
});

describe('JwtStrategy', () => {
  it('maps valid payload to auth context', async () => {
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://api.test';
    const moduleRef = await Test.createTestingModule({ providers: [JwtStrategy] }).compile();
    const strategy = moduleRef.get(JwtStrategy);
    expect(
      strategy.validate({
        sub: 'auth0|123',
        p7vc_user_id: 'user-1',
        p7vc_role: 'Director',
        p7vc_team_id: 'team-1',
      }),
    ).toEqual({
      sub: 'auth0|123',
      p7vcUserId: 'user-1',
      p7vcRole: 'Director',
      p7vcTeamId: 'team-1',
    });
  });

  it('rejects missing claims', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [JwtStrategy] }).compile();
    const strategy = moduleRef.get(JwtStrategy);
    expect(() => strategy.validate({ sub: 'auth0|123' })).toThrow(UnauthorizedException);
  });
});
