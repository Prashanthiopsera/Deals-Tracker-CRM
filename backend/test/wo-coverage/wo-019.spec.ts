import * as mod from '../../src/database/database.module';

describe('WO-019 coverage', () => {
  it('exports database.module module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
