export const mockMcpJwtContexts = {
  director: { userId: 'director-1', role: 'Director', teamId: 'team-1' },
  associate: { userId: 'associate-1', role: 'Associate', teamId: 'team-1' },
  intern: { userId: 'intern-1', role: 'Intern', teamId: 'team-1' },
};

export const mcpToolActions: Record<string, { action: string; resourceType: string }> = {
  search_companies: { action: 'read', resourceType: 'Company' },
  get_record: { action: 'read', resourceType: 'Company' },
  create_record: { action: 'create', resourceType: 'Company' },
  update_fields: { action: 'update', resourceType: 'Company' },
  reassign_owner: { action: 'reassign', resourceType: 'Company' },
};
