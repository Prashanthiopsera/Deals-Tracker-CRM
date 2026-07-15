import { CompanyStatus, DealStage } from '../../src/database/enums';

export function buildValidCompanyPayload(overrides: Record<string, unknown> = {}) {
  return {
    company_name: 'Nova AI',
    website: 'https://nova.ai',
    sector: 'AI',
    geography: 'US',
    deal_stage: DealStage.SOURCED,
    status: CompanyStatus.ACTIVE,
    tags: ['priority'],
    ...overrides,
  };
}

export function buildInvalidCompanyPayload() {
  return { website: 'https://missing-name.example' };
}

export function buildCompanyEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Nova AI',
    dealLeadId: null,
    support1Id: null,
    support2Id: null,
    dealStage: DealStage.SOURCED,
    status: CompanyStatus.ACTIVE,
    sector: 'AI',
    geography: 'US',
    tags: ['priority'],
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}
