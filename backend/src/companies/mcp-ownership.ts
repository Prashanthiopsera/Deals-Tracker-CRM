export function stripMcpOwnershipFields(
  role: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (role !== 'Intern') {
    return payload;
  }
  const clone = { ...payload };
  delete clone.deal_lead_id;
  delete clone.support1_id;
  delete clone.support2_id;
  return clone;
}
