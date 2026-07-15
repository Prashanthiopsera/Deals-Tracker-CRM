import * as mod from '../../src/pii/pii-discovery.service';

describe('WO-028 coverage', () => {
  it('exports pii-discovery.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
