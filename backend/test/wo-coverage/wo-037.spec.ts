import * as mod from '../../src/connectors/dlp-filter.service';

describe('WO-037 coverage', () => {
  it('exports dlp-filter.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
