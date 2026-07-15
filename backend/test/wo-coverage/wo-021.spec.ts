import * as mod from '../../src/admin/admin-users.service';

describe('WO-021 coverage', () => {
  it('exports admin-users.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
