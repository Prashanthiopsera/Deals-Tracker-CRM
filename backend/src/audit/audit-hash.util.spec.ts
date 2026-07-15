import { computeAuditTamperHash } from './audit-hash.util';

describe('audit hash util (WO-122)', () => {
  it('produces deterministic tamper hashes', () => {
    const input = {
      actorId: 'u1',
      operation: 'update',
      resourceId: 'c1',
      beforeState: { stage: 'SOURCED' },
      afterState: { stage: 'SCREENING' },
      timestamp: '2026-07-14T00:00:00Z',
    };
    expect(computeAuditTamperHash(input)).toBe(computeAuditTamperHash(input));
  });
});
