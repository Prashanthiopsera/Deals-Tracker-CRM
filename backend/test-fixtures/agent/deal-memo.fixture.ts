export const dealMemoTemplateSections = [
  'Company Overview',
  'Market Opportunity',
  'Team Assessment',
  'Deal Terms',
  'Key Risks',
  'Recommendation',
];

export const sampleBedrockMemoResponse = {
  content: `# IC Memo Draft\n\n## Company Overview\nAcme Robotics builds industrial automation.\n\n## Recommendation\nProceed to diligence.`,
  modelId: 'anthropic.claude-3-sonnet',
  inputTokens: 1200,
  outputTokens: 800,
};

export const sampleCompanyMemoContext = {
  company: { id: '11111111-1111-1111-1111-111111111111', name: 'Acme Robotics', sector: 'Robotics' },
  notes: ['Priority target'],
  activities: [{ type: 'meeting', summary: 'Intro call completed' }],
};
