import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns health payload', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getHealth().status).toBe('ok');
  });

  it('throws when not ready', async () => {
    delete process.env.DATABASE_URL;
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(() => controller.getReadiness()).toThrow(ServiceUnavailableException);
  });

  it('returns readiness when database is available', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getReadiness().ready).toBe(true);
  });
});
