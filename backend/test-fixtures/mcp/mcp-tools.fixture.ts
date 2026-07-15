export const sampleMcpToolInputs = {
  search_companies: { query: 'Acme', sector: 'Robotics' },
  get_record: { company_id: '11111111-1111-1111-1111-111111111111' },
  create_record: { company_name: 'TestCo', sector: 'AI' },
  update_fields: {
    company_id: '11111111-1111-1111-1111-111111111111',
    fields: { notes: 'Updated via MCP' },
  },
  reassign_owner: {
    company_id: '11111111-1111-1111-1111-111111111111',
    field_name: 'deal_lead',
    new_owner_id: '55555555-5555-5555-5555-555555555555',
  },
};

export const sampleMcpToolDefinitions = [
  'search_companies',
  'get_record',
  'create_record',
  'update_fields',
  'reassign_owner',
];
