export const dlpPolicyFixtures = [
  { id: 'p1', pattern: 'email', action: 'redact', connector_scope: '*' },
  { id: 'p2', pattern: 'ownership_field', action: 'block', connector_scope: '*' },
];

export const dlpViolationPayloadFixture = {
  deal_lead_id: 'user-1',
  contact_email: 'secret@example.com',
  notes: 'Reach out to secret@example.com',
};
