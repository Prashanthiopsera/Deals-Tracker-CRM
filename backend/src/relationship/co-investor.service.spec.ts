import { CoInvestorService } from './co-investor.service';

describe('CoInvestorService (WO-133)', () => {
  it('builds co-investor graph by investor name', () => {
    const svc = new CoInvestorService();
    svc.add({ company_id: 'c1', investor_name: 'Fund A', investor_type: 'VC', round_stage: 'Seed' });
    svc.add({ company_id: 'c2', investor_name: 'Fund A', investor_type: 'VC', round_stage: 'Series A' });
    expect(svc.graphByInvestor('Fund A')).toHaveLength(2);
  });
});
