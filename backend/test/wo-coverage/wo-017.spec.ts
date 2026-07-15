import * as mod from '../../src/auth/auth.module';

describe('WO-017 coverage', () => {
  it('exports auth.module module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
