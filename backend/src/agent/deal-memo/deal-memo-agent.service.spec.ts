import { buildDealMemoPrompt, renderMemoTemplate } from './deal-memo-prompt';
import { sampleCompanyMemoContext } from '../../../test-fixtures/agent/deal-memo.fixture';

describe('DealMemoAgent (WO-091)', () => {
  it('builds structured IC memo prompt with required sections', () => {
    const prompt = buildDealMemoPrompt(sampleCompanyMemoContext);
    expect(prompt).toContain('Company Overview');
    expect(prompt).toContain('Acme Robotics');
  });

  it('renders memo template sections from LLM output', () => {
    const sections = renderMemoTemplate(
      '## Company Overview\nAcme builds robots.\n\n## Recommendation\nProceed.',
    );
    expect(sections['Company Overview']).toContain('Acme');
    expect(sections.Recommendation).toContain('Proceed');
  });
});
