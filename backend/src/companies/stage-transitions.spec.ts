import { DealStage } from '../database/enums';
import { allowedNextStages, validateStageTransition } from './stage-transitions';

describe('stage transitions', () => {
  it('allows sequential sourced to screening transition', () => {
    expect(allowedNextStages(DealStage.SOURCED)).toContain(DealStage.SCREENING);
    expect(() => validateStageTransition(DealStage.SOURCED, DealStage.SCREENING)).not.toThrow();
  });

  it('rejects sourced to term sheet transition', () => {
    expect(() => validateStageTransition(DealStage.SOURCED, DealStage.TERM_SHEET)).toThrow();
  });

  it('allows pass from any stage', () => {
    expect(() => validateStageTransition(DealStage.DILIGENCE, DealStage.CLOSED_PASSED)).not.toThrow();
  });
});
