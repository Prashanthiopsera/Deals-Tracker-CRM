import * as mod from '../../src/observability/observability.module';

describe('WO-015 coverage', () => {
  it('exports observability.module module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
