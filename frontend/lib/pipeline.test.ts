import { canDragCards, daysInStage } from './pipeline-stages';
import { loadPipelineBoard } from './companies-api';

const companiesFixture = require('../test-fixtures/companies-pipeline.json') as Array<{
  deal_stage: string;
}>;

describe('pipeline stages', () => {
  it('calculates days in stage from key dates', () => {
    const days = daysInStage({ screening_entered_at: '2026-01-01T00:00:00Z' }, 'screening');
    expect(days).toBeGreaterThan(0);
  });

  it('allows drag for director principal associate', () => {
    expect(canDragCards('Director')).toBe(true);
    expect(canDragCards('Intern')).toBe(false);
  });
});

describe('companies api', () => {
  it('loads companies across all stages', async () => {
    const api = {
      listByStage: jest.fn(async (stage: string) =>
        (companiesFixture as Array<{ deal_stage: string }>).filter((row) => row.deal_stage === stage),
      ),
      transitionStage: jest.fn(),
    };
    const rows = await loadPipelineBoard(api, ['sourced', 'screening']);
    expect(rows).toHaveLength(2);
  });
});
