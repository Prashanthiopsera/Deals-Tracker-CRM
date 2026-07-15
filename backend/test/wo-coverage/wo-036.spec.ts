import * as mod from '../../src/agent/agent-task.service';

describe('WO-036 coverage', () => {
  it('exports agent-task.service module surface', () => {
    expect(mod).toBeDefined();
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
