import { SessionLifecycleService } from './session-lifecycle.service';

describe('SessionLifecycleService (WO-020)', () => {
  it('stores and validates sessions', () => {
    const svc = new SessionLifecycleService();
    svc.store('s1', 'refresh', 60_000);
    expect(svc.validate('s1')).toBe(true);
    svc.revoke('s1');
    expect(svc.validate('s1')).toBe(false);
  });
});
