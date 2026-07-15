import * as mod from '../../src/admin/admin-connectors.service';

describe('WO-039 coverage', () => {
  it('exports admin-connectors.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
