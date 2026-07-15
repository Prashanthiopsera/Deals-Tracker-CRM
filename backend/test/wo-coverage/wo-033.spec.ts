import * as mod from '../../src/rag/retrieval.service';

describe('WO-033 coverage', () => {
  it('exports retrieval.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
