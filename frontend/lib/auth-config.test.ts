import { authConfig } from '@/lib/auth-config';

describe('authConfig', () => {
  it('returns auth0 settings from environment', () => {
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://api.test';
    const config = authConfig();
    expect(config.domain).toBe('test.auth0.com');
    expect(config.audience).toBe('https://api.test');
  });
});
