import { RedTeamEvalService } from './red-team-eval.service';
import { redTeamLeakyResponse, redTeamPromptCorpus, redTeamSafeResponses } from '../../test-fixtures/rag/red-team.fixture';

describe('RedTeamEvalService (WO-083)', () => {
  const service = new RedTeamEvalService();

  it('runs at least 50 adversarial test cases', () => {
    const report = service.runSuite(redTeamSafeResponses);
    expect(report.totalTests).toBeGreaterThanOrEqual(50);
    expect(report.overallPass).toBe(true);
  });

  it('fails the suite when leakage incidents are detected', () => {
    const internCase = redTeamPromptCorpus.find((testCase) => testCase.role === 'Intern');
    const responses = {
      ...redTeamSafeResponses,
      [internCase!.id]: redTeamLeakyResponse,
    };
    const report = service.runSuite(responses);
    expect(report.overallPass).toBe(false);
    expect(report.leakageIncidents.length).toBeGreaterThan(0);
  });

  it('produces structured JSON report fields', () => {
    const report = service.runSuite(redTeamSafeResponses);
    expect(report).toMatchObject({
      totalTests: expect.any(Number),
      passed: expect.any(Number),
      failed: expect.any(Number),
      leakageIncidents: expect.any(Array),
      overallPass: expect.any(Boolean),
    });
  });
});
