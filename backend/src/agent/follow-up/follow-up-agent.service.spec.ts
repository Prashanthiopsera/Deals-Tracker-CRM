import { extractFollowUpsFromTranscript, redactFollowUpPii } from './follow-up-detector.service';
import { granolaMeetingFixture } from '../../../test-fixtures/agent/follow-up.fixture';

describe('FollowUpAgent (WO-092)', () => {
  it('extracts follow-ups and matches company records', () => {
    const items = extractFollowUpsFromTranscript(granolaMeetingFixture.transcript);
    expect(items[0].company_id).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('redacts participant PII from follow-ups', () => {
    const redacted = redactFollowUpPii({ owner: 'alice@example.com', action: 'Call CEO' });
    expect(redacted.owner).toBe('[REDACTED]');
  });
});
