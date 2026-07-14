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
    deal_lead_id: company.deal_lead_id ?? company.dealLeadId ?? company.p7vc_deal_lead,
    support1_id: company.support_1_id ?? company.support1Id ?? company.deal_lead_support_1,
    support2_id: company.support_2_id ?? company.support2Id ?? company.deal_lead_support_2,
    deal_stage: company.deal_stage ?? company.dealStage,
    sector: company.sector,
    geography: company.geography,
    tags: company.tags,
    notes: company.notes,
    status: company.status,
    created_at: company.created_at ?? company.createdAt,
    updated_at: company.updated_at ?? company.updatedAt,
  };
}
