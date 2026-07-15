import { snsStageChangeEventFixture, slackChannelRoutingFixture } from '../../../test-fixtures/connectors/slack.fixture';

export function formatSlackBlockKit(event: typeof snsStageChangeEventFixture) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${event.companyName}* moved to *${event.dealStage}* by ${event.actorName}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Open in CRM' },
            url: `https://crm.example/companies/${event.companyId}`,
          },
        ],
      },
    ],
  };
}

export function routeSlackChannel(eventType: keyof typeof slackChannelRoutingFixture): string {
  return slackChannelRoutingFixture[eventType];
}

export async function sendWithRetry(send: () => Promise<void>, retries = 3): Promise<void> {
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await send();
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }
  }
}
