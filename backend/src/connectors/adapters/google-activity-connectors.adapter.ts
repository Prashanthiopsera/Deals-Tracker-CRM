import { ConnectorHealthResult, IConnectorAdapter } from '../connector.types';
import {
  calendarEventsFixture,
  gmailMessageDetailFixture,
  gmailMessageListFixture,
} from '../../../test-fixtures/connectors/google-activity.fixture';
import {
  ActivityQueueService,
  ConnectorSyncStateService,
  matchCompanyByEmail,
} from '../activity/activity-capture.service';

const companyDomains: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'acmerobotics.com',
};

export class GmailConnectorAdapter implements IConnectorAdapter {
  constructor(
    private readonly syncState: ConnectorSyncStateService,
    private readonly activityQueue: ActivityQueueService,
  ) {}

  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = String(input.user_id ?? 'director-1');
    const state = this.syncState.get(userId, 'gmail');
    const list = state?.history_id ? gmailMessageListFixture : gmailMessageListFixture;
    const detail = gmailMessageDetailFixture;
    this.syncState.save({
      user_id: userId,
      connector_type: 'gmail',
      history_id: list.historyId,
    });
    const matchedCompanyId = matchCompanyByEmail([detail.from, ...detail.to], companyDomains);
    this.activityQueue.publish({
      activity_type: 'email',
      matched_company_id: matchedCompanyId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      payload: detail as unknown as Record<string, unknown>,
    });
    return { synced: 1, historyId: list.historyId };
  }
  async shutdown(): Promise<void> {}
}

export class GoogleCalendarConnectorAdapter implements IConnectorAdapter {
  constructor(
    private readonly syncState: ConnectorSyncStateService,
    private readonly activityQueue: ActivityQueueService,
  ) {}

  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const userId = String(input.user_id ?? 'director-1');
    const events = calendarEventsFixture;
    this.syncState.save({
      user_id: userId,
      connector_type: 'google_calendar',
      sync_token: events.syncToken,
    });
    const attendeeEmails = events.items.flatMap((event) =>
      event.attendees.map((attendee) => attendee.email),
    );
    const matchedCompanyId = matchCompanyByEmail(attendeeEmails, companyDomains);
    this.activityQueue.publish({
      activity_type: 'meeting',
      matched_company_id: matchedCompanyId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      payload: events.items[0] as unknown as Record<string, unknown>,
    });
    return { synced: events.items.length, syncToken: events.syncToken };
  }
  async shutdown(): Promise<void> {}
}
