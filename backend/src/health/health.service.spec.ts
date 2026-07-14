import { HealthService } from './health.service';

describe('HealthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns ok when database URL is configured', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const service = new HealthService();
    expect(service.check().status).toBe('ok');
    expect(service.check().database).toBe('connected');
  });

  it('returns disconnected without database URL', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_CHECK;
    const service = new HealthService();
    expect(service.check().database).toBe('disconnected');
  });

  it('readiness returns 503 state when database unavailable', () => {
    delete process.env.DATABASE_URL;
    const service = new HealthService();
    expect(service.readiness().ready).toBe(false);
  });
});
