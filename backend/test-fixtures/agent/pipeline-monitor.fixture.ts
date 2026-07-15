export type PipelineMonitorCompany = {
  id: string;
  name: string;
  deal_stage: string;
  updated_at: string;
  deal_lead_id: string;
  term_sheet_expiry?: string;
};

export const pipelineMonitorFixtures: PipelineMonitorCompany[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Acme Robotics',
    deal_stage: 'SOURCED',
    updated_at: '2026-06-01T00:00:00Z',
    deal_lead_id: 'director-1',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Beta AI',
    deal_stage: 'DILIGENCE',
    updated_at: '2026-07-01T00:00:00Z',
    deal_lead_id: 'principal-1',
    term_sheet_expiry: '2026-07-20T00:00:00Z',
  },
];

export const defaultStalenessThresholds: Record<string, number> = {
  SOURCED: 14,
  SCREENING: 7,
  DILIGENCE: 21,
  'PARTNER/IC REVIEW': 14,
  'TERM SHEET': 7,
};
