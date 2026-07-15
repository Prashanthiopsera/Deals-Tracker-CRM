export const automationRuleFixtures = [
  {
    from_stage: 'SCREENING',
    to_stage: 'DILIGENCE',
    actions: ['SLACK_NOTIFY', 'CREATE_CHECKLIST'],
  },
];
