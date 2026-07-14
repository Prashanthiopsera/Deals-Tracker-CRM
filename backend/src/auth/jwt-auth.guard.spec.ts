import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  it('allows bypass mode for tests', () => {
    process.env.AUTH_BYPASS = 'true';
    const guard = new JwtAuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    };
    expect(guard.canActivate(context as never)).toBe(true);
    delete process.env.AUTH_BYPASS;
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
