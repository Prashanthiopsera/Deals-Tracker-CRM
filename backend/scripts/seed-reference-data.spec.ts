import { buildReferenceSeedSql, referenceSeedRoles, referenceSeedStages } from './seed-reference-data';

describe('seed-reference-data (WO-016)', () => {
  it('defines pipeline stages and roles', () => {
    expect(referenceSeedStages).toContain('DILIGENCE');
    expect(referenceSeedRoles).toContain('Director');
    expect(buildReferenceSeedSql()).toContain('Director');
  });
});
