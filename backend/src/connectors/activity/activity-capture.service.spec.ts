import {
  ActivityQueueService,
  ConnectorSyncStateService,
  matchCompanyByEmail,
} from '../activity/activity-capture.service';
import {
  GmailConnectorAdapter,
  GoogleCalendarConnectorAdapter,
} from '../adapters/google-activity-connectors.adapter';

describe('GoogleActivityConnectors (WO-097)', () => {
  const syncState = new ConnectorSyncStateService();
  const activityQueue = new ActivityQueueService();

  beforeEach(() => {
    activityQueue.queue.length = 0;
  });

  it('matches email domains to company records', () => {
    const companyId = matchCompanyByEmail(['ceo@acmerobotics.com'], {
      '11111111-1111-1111-1111-111111111111': 'acmerobotics.com',
    });
    expect(companyId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('persists gmail historyId and publishes activity queue messages', async () => {
    const gmail = new GmailConnectorAdapter(syncState, activityQueue);
    await gmail.execute({ user_id: 'director-1' });
    expect(syncState.get('director-1', 'gmail')?.history_id).toBe('12345');
    expect(activityQueue.queue[0]?.activity_type).toBe('email');
  });

  it('persists calendar syncToken and publishes meeting activities', async () => {
    const calendar = new GoogleCalendarConnectorAdapter(syncState, activityQueue);
    await calendar.execute({ user_id: 'director-1' });
    expect(syncState.get('director-1', 'google_calendar')?.sync_token).toBe('cal-sync-1');
    expect(activityQueue.queue[0]?.activity_type).toBe('meeting');
  });
});
