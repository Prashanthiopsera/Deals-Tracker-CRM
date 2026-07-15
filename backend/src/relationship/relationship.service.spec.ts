import { createAuditTestStack } from '../audit/audit-test.utils';
import { CoInvestorService } from './co-investor.service';
import { RelationshipScoringService } from './relationship-scoring.service';
import { WarmIntroPathService } from './warm-intro-path.service';

describe('Relationship intelligence (WO-131/132/133)', () => {
  const { service: audit } = createAuditTestStack();

  it('computes relationship scores', () => {
    const scoring = new RelationshipScoringService(audit);
    const scores = scoring.computeBatch('director-1', [
      { user_id: 'u1', contact_id: 'ct1', company_id: 'c1', signals: { email: 40, meeting: 30 } },
    ]);
    expect(scores[0].score).toBe(70);
  });

  it('finds warm intro paths with bottleneck scoring', () => {
    const paths = new WarmIntroPathService();
    const result = paths.findPaths('target', {
      target: [{ user_id: 'u1', score: 80 }],
    });
    expect(result[0].strength).toBe(80);
  });

  it('lists co-investors by company', () => {
    const co = new CoInvestorService();
    co.add({ company_id: 'c1', investor_name: 'Fund A', investor_type: 'VC', round_stage: 'Seed' });
    expect(co.listByCompany('c1')).toHaveLength(1);
  });
});
