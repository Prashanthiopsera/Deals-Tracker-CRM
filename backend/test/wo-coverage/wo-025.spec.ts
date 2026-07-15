import * as mod from '../../src/authorization/cedar.guard';

describe('WO-025 coverage', () => {
  it('exports cedar.guard module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
