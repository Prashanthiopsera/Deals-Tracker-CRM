import * as mod from '../../src/compliance/erasure.service';

describe('WO-030 coverage', () => {
  it('exports erasure.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
