export const mockChatPrompts = {
  director: 'Summarize Nova AI diligence notes',
  intern: 'What is the check size for Company 1?',
};

export const mockClaudeResponse = {
  modelId: 'anthropic.claude-3-sonnet',
  content:
    'Nova AI is a robotics company with enterprise traction. Contact ada@example.com for follow-up.',
  inputTokens: 120,
  outputTokens: 45,
};

export const mockUnavailableBedrockError = new Error('Bedrock circuit open');
