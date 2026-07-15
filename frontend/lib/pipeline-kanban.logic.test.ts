import { applyOptimisticStage, isDragEnabled, replaceCompany } from './pipeline-kanban.logic';

const companiesFixture = require('../test-fixtures/companies-pipeline.json') as Array<{
  id: string;
  deal_stage: string;
}>;

describe('pipeline kanban logic (WO-049)', () => {
  it('applies optimistic stage updates', () => {
    const updated = applyOptimisticStage(companiesFixture as never, companiesFixture[0].id, 'screening');
    expect(updated[0].deal_stage).toBe('screening');
  });

  it('replaces company after successful transition', () => {
    const next = replaceCompany(companiesFixture as never, {
      ...(companiesFixture[0] as object),
      deal_stage: 'diligence',
    } as never);
    expect(next[0].deal_stage).toBe('diligence');
  });

  it('disables drag for intern role', () => {
    expect(isDragEnabled('Intern')).toBe(false);
    expect(isDragEnabled('Associate')).toBe(true);
  });
});
