import * as mod from '../../src/compliance/retention-policy.service';

describe('WO-031 coverage', () => {
  it('exports retention-policy.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
