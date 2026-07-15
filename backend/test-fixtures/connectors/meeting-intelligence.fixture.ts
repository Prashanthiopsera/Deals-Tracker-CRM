export const granolaWebhookFixture = {
  meeting_id: 'granola-1',
  title: 'Intro call',
  notes: 'Discuss term sheet',
  action_items: [{ description: 'Send deck', assignee: 'Alice', due_date: '2026-07-18' }],
  attendees: [{ email: 'ceo@acmerobotics.com' }],
};

export const zoomWebhookFixture = {
  event: 'meeting.ended',
  payload: {
    object: {
      id: 'zoom-1',
      topic: 'Diligence sync',
      duration: 45,
      participant_email: 'ceo@acmerobotics.com',
    },
  },
};

export const meetingIntelligenceFixture = {
  meeting_id: 'zoom-1',
  title: 'Diligence sync',
  date: '2026-07-14T15:00:00Z',
  duration: 45,
  attendees: ['ceo@acmerobotics.com'],
  transcript_summary: '[REDACTED contact details]',
  action_items: [{ description: 'Send deck', assignee: 'Alice', due_date: '2026-07-18', status: 'pending' }],
  source: 'zoom',
};
