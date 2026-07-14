import { CompanyFundingStage, CompanyStatus, DealStage } from '../enums';

export const companySeedRows = [
  {
    name: 'Nova AI',
    sector: 'AI/ML',
    companyStage: CompanyFundingStage.SEED,
    geography: 'US',
    dealStage: DealStage.SOURCED,
    status: CompanyStatus.ACTIVE,
    tags: ['ai', 'enterprise'],
  },
  {
    name: 'GreenGrid Energy',
    sector: 'Climate',
    companyStage: CompanyFundingStage.SERIES_A,
    geography: 'EU',
    dealStage: DealStage.SCREENING,
    status: CompanyStatus.ACTIVE,
    tags: ['climate', 'energy'],
  },
  {
    name: 'HealthBridge',
    sector: 'HealthTech',
    companyStage: CompanyFundingStage.SERIES_B,
    geography: 'US',
    dealStage: DealStage.DILIGENCE,
    status: CompanyStatus.ACTIVE,
    tags: ['health'],
  },
  {
    name: 'LedgerFlow',
    sector: 'Fintech',
    companyStage: CompanyFundingStage.GROWTH,
    geography: 'APAC',
    dealStage: DealStage.PARTNER_IC_REVIEW,
    status: CompanyStatus.ACTIVE,
    tags: ['fintech'],
  },
  {
    name: 'Orbit Security',
    sector: 'Cybersecurity',
    companyStage: CompanyFundingStage.LATE_STAGE,
    geography: 'US',
    dealStage: DealStage.TERM_SHEET,
    status: CompanyStatus.ACTIVE,
    tags: ['security'],
  },
  {
    name: 'ClosedWin Co',
    sector: 'SaaS',
    companyStage: CompanyFundingStage.SERIES_C,
    geography: 'US',
    dealStage: DealStage.CLOSED_WON,
    status: CompanyStatus.PORTFOLIO,
    tags: ['saas'],
  },
];

export const companiesSeedSql = `
INSERT INTO companies (
  name, sector, company_stage, geography, deal_stage, status, tags, key_dates, check_size, valuation
) VALUES
  ('Nova AI', 'AI/ML', 'seed', 'US', 'sourced', 'Active', ARRAY['ai','enterprise'], '{"first_meeting":"2026-01-10"}', 2500000, 12000000),
  ('GreenGrid Energy', 'Climate', 'series_a', 'EU', 'screening', 'Active', ARRAY['climate','energy'], '{}', 5000000, 25000000),
  ('HealthBridge', 'HealthTech', 'series_b', 'US', 'diligence', 'Active', ARRAY['health'], '{}', 8000000, 40000000),
  ('LedgerFlow', 'Fintech', 'growth', 'APAC', 'partner_ic_review', 'Active', ARRAY['fintech'], '{}', 15000000, 90000000),
  ('Orbit Security', 'Cybersecurity', 'late_stage', 'US', 'term_sheet', 'Active', ARRAY['security'], '{}', 20000000, 120000000),
  ('ClosedWin Co', 'SaaS', 'series_c', 'US', 'closed_won', 'Portfolio', ARRAY['saas'], '{}', 10000000, 80000000)
ON CONFLICT DO NOTHING;
`;
