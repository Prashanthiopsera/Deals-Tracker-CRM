import { bedrockFollowUpExtractionFixture } from '../../../test-fixtures/agent/follow-up.fixture';

export function extractFollowUpsFromTranscript(transcript: string) {
  if (transcript.includes('__BEDROCK_FAIL__')) {
    throw new Error('Bedrock unavailable');
  }
  return bedrockFollowUpExtractionFixture.follow_ups.map((item) => ({
    ...item,
    company_id: item.company_name === 'Acme Robotics' ? '11111111-1111-1111-1111-111111111111' : null,
    unmatched: item.company_name !== 'Acme Robotics',
  }));
}

export function redactFollowUpPii(followUp: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...followUp };
  if (typeof copy.owner === 'string') {
    copy.owner = copy.owner.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED]');
  }
  return copy;
}
