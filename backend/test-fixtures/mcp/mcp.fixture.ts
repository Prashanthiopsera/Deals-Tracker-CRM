export const sampleMcpToolDefinitions = [
  {
    name: 'search_companies',
    description: 'Search companies in the CRM',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
];

export const sampleMcpHealthResponse = {
  status: 'ok',
  version: '0.1.0',
  toolCount: 1,
};
