import { StageTransitionHistoryService, onCompanyStageUpdated } from './stage-transition-history.service';

describe('StageTransitionHistoryService (WO-108)', () => {
  it('records transitions when company stage changes', () => {
    const service = new StageTransitionHistoryService();
    const entry = onCompanyStageUpdated(
      service,
      '11111111-1111-1111-1111-111111111111',
      'SOURCED',
      'SCREENING',
      'director-1',
    );
    expect(entry.to_stage).toBe('SCREENING');
    expect(service.listByCompany('11111111-1111-1111-1111-111111111111')).toHaveLength(1);
  });
});
