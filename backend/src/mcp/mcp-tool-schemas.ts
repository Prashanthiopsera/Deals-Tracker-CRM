export interface McpToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; fields?: Record<string, string> };
}

export const mcpToolSchemas = {
  search_companies: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string' },
      sector: { type: 'string' },
      stage: { type: 'string' },
      geography: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      page: { type: 'number' },
      limit: { type: 'number' },
    },
  },
  get_record: {
    type: 'object',
    required: ['company_id'],
    properties: { company_id: { type: 'string' } },
  },
  create_record: {
    type: 'object',
    required: ['company_name'],
    properties: {
      company_name: { type: 'string' },
      sector: { type: 'string' },
      geography: { type: 'string' },
      deal_stage: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
    },
  },
  update_fields: {
    type: 'object',
    required: ['company_id', 'fields'],
    properties: {
      company_id: { type: 'string' },
      fields: { type: 'object' },
    },
  },
  reassign_owner: {
    type: 'object',
    required: ['company_id', 'field_name', 'new_owner_id'],
    properties: {
      company_id: { type: 'string' },
      field_name: { type: 'string', enum: ['deal_lead', 'support_1', 'support_2'] },
      new_owner_id: { type: 'string' },
    },
  },
} as const;

export function validateMcpInput(
  toolName: keyof typeof mcpToolSchemas,
  input: Record<string, unknown>,
): Record<string, string> | null {
  const schema = mcpToolSchemas[toolName];
  const errors: Record<string, string> = {};
  for (const field of schema.required ?? []) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      errors[field] = 'required';
    }
  }
  if (toolName === 'update_fields' && input.fields && typeof input.fields !== 'object') {
    errors.fields = 'must be an object';
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
