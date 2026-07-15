import { RedTeamEvalService } from '../../src/ai/red-team-eval.service';

describe('AI assistant red-team suite (WO-126)', () => {
  const service = new RedTeamEvalService();

  it('runs adversarial cases and returns compliance report', () => {
    const report = service.runSuite({});
    expect(report.totalTests).toBeGreaterThan(0);
    expect(report.passed + report.failed).toBe(report.totalTests);
  });
});
