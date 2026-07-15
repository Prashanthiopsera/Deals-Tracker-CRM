import { SlackConnectorAdapter } from './slack-connector.adapter.impl';
import { formatSlackBlockKit, sendWithRetry } from './slack-connector.adapter';
import { snsStageChangeEventFixture } from '../../../test-fixtures/connectors/slack.fixture';

describe('SlackConnectorAdapter (WO-098)', () => {
  it('formats Block Kit messages with CRM deep link', () => {
    const blocks = formatSlackBlockKit(snsStageChangeEventFixture);
    expect(JSON.stringify(blocks)).toContain('Open in CRM');
  });

  it('retries failed deliveries with exponential backoff', async () => {
    jest.useFakeTimers();
    let attempts = 0;
    const promise = sendWithRetry(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('rate limited');
    }, 3);
    await jest.advanceTimersByTimeAsync(1000);
    await promise;
    expect(attempts).toBe(2);
    jest.useRealTimers();
  });

  it('delivers stage change notifications to configured channel', async () => {
    const adapter = new SlackConnectorAdapter();
    const result = await adapter.execute({});
    expect(result.channel).toBe('#deals');
  });
});
