import { getMetadataArgsStorage } from 'typeorm';
import { Company } from './company.entity';
import { CompanyFundingStage, DealStage } from '../enums';

describe('Company entity', () => {
  const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Company);

  it('defines UUID primary key and required pipeline columns', () => {
    const names = columns.map((c) => c.propertyName);
    expect(names).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'dealStage',
        'dealLeadId',
        'support1Id',
        'support2Id',
        'createdById',
        'keyDates',
        'checkSize',
        'valuation',
        'tags',
        'deletedAt',
      ]),
    );
  });

  it('uses deal pipeline and funding stage enums', () => {
    expect(DealStage.SOURCED).toBe('sourced');
    expect(CompanyFundingStage.SERIES_A).toBe('series_a');
  });

  it('maps ownership columns to user FK join columns', () => {
    const relations = getMetadataArgsStorage().relations.filter((r) => r.target === Company);
    expect(relations.map((r) => r.propertyName)).toEqual(
      expect.arrayContaining(['dealLead', 'support1', 'support2', 'createdBy']),
    );
  });
});
