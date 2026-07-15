export const granolaMeetingFixture = {
  source: 'granola',
  transcript: 'Action: Send term sheet by Friday. Owner: Alice. Company: Acme Robotics.',
};

export const zoomMeetingFixture = {
  source: 'zoom',
  transcript: 'Follow up with CEO next week regarding diligence materials for Acme Robotics.',
};

export const bedrockFollowUpExtractionFixture = {
  follow_ups: [
    {
      action: 'Send term sheet',
      owner: 'Alice',
      deadline: '2026-07-18',
      company_name: 'Acme Robotics',
    },
    {
      action: 'Follow up with CEO',
      owner: 'Bob',
      deadline: '2026-07-21',
      company_name: 'Acme Robotics',
    },
  ],
};
