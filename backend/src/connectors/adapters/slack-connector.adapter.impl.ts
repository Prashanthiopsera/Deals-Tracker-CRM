import { ConnectorHealthResult, IConnectorAdapter } from '../connector.types';
import { formatSlackBlockKit, routeSlackChannel, sendWithRetry } from './slack-connector.adapter';
import { snsStageChangeEventFixture } from '../../../test-fixtures/connectors/slack.fixture';

export class SlackConnectorAdapter implements IConnectorAdapter {
  readonly sent: Array<{ channel: string; payload: unknown }> = [];

  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const event = (input.event ?? snsStageChangeEventFixture) as typeof snsStageChangeEventFixture;
    const channel = routeSlackChannel(event.eventType as 'stage_change');
    const payload = formatSlackBlockKit(event);
    await sendWithRetry(async () => {
      this.sent.push({ channel, payload });
    });
    return { delivered: true, channel, payload };
  }
  async shutdown(): Promise<void> {}
}
