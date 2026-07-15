import { formatRelativeTime } from './activities-api';

describe('activities api helpers (WO-106)', () => {
  it('formats relative timestamps', () => {
    const recent = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(formatRelativeTime(recent)).toBe('2 hours ago');
  });
});
