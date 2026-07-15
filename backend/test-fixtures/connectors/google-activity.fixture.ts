export const gmailMessageListFixture = {
  historyId: '12345',
  messages: [{ id: 'msg-1', threadId: 'thread-1' }],
};

export const gmailMessageDetailFixture = {
  id: 'msg-1',
  from: 'ceo@acmerobotics.com',
  to: ['investor@p7vc.com'],
  subject: 'Follow up',
  snippet: 'Thanks for the meeting',
};

export const calendarEventsFixture = {
  syncToken: 'cal-sync-1',
  items: [
    {
      id: 'evt-1',
      summary: 'Diligence call',
      attendees: [{ email: 'ceo@acmerobotics.com' }],
      start: { dateTime: '2026-07-14T15:00:00Z' },
    },
  ],
};

export const connectorSyncStateFixture = {
  user_id: 'director-1',
  connector_type: 'gmail',
  history_id: '12345',
  sync_token: null,
};
