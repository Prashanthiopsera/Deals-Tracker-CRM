export const snsStageChangeEventFixture = {
  eventType: 'stage_change',
  companyId: '11111111-1111-1111-1111-111111111111',
  companyName: 'Acme Robotics',
  dealStage: 'DILIGENCE',
  actorName: 'Director One',
  actorEmail: 'director@p7vc.com',
};

export const slackChannelRoutingFixture = {
  stage_change: '#deals',
  reassignment: '#deals',
  mention: 'dm',
};
