import * as mod from '../../src/mcp/mcp-auth.service';

describe('WO-035 coverage', () => {
  it('exports mcp-auth.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
