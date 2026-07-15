const OWNERSHIP_FIELDS = new Set(['deal_lead_id', 'deal_lead_support_1_id', 'deal_lead_support_2_id']);

export function shouldShowFieldHistory(fieldName: string, role: string): boolean {
  return !(role === 'Intern' && OWNERSHIP_FIELDS.has(fieldName));
}
