import { buildFunnelData } from '../lib/analytics-api';

describe('pipeline analytics dashboard helpers (WO-109)', () => {
  it('builds funnel stage counts', () => {
    const funnel = buildFunnelData({ SOURCED: 3, SCREENING: 2 });
    expect(funnel).toEqual([
      ['SOURCED', 3],
      ['SCREENING', 2],
    ]);
  });
});
