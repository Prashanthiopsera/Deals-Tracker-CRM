import { EcsHealthService } from './ecs-health.service';

describe('EcsHealthService (WO-063)', () => {
  it('reports task health', () => {
    const svc = new EcsHealthService();
    expect(svc.checkTaskHealth().status).toBe('ok');
  });
});
