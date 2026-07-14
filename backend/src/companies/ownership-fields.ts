export const OWNERSHIP_FIELD_KEYS = [
  'deal_lead_id',
  'support1_id',
  'support2_id',
  'p7vc_deal_lead',
  'deal_lead_support_1',
  'deal_lead_support_2',
] as const;

export type OwnershipFieldKey = (typeof OWNERSHIP_FIELD_KEYS)[number];

export function stripOwnershipFields<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, OwnershipFieldKey> {
  const clone = { ...payload };
  for (const key of OWNERSHIP_FIELD_KEYS) {
    delete clone[key];
  }
  return clone;
}

export function containsOwnershipFields(body: Record<string, unknown>): boolean {
  return OWNERSHIP_FIELD_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key));
}

export function toCompanyResponse(company: Record<string, unknown>): Record<string, unknown> {
  return {
    id: company.id,
    name: company.name,
    deal_lead_id: company.p7vc_deal_lead ?? company.deal_lead_id,
    support1_id: company.deal_lead_support_1 ?? company.support1_id,
    support2_id: company.deal_lead_support_2 ?? company.support2_id,
    notes: company.notes,
    status: company.status,
  };
}
