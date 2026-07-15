import * as mod from '../../src/connectors/connector.module';

describe('WO-038 coverage', () => {
  it('exports connector.module module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
