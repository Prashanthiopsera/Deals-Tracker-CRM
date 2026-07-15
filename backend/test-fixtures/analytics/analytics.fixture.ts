export const analyticsCompanyFixtures = [
  { id: 'c1', deal_stage: 'SOURCED', sector: 'AI', geography: 'US', deal_lead_id: 'lead-1' },
  { id: 'c2', deal_stage: 'SCREENING', sector: 'AI', geography: 'US', deal_lead_id: 'lead-1' },
  { id: 'c3', deal_stage: 'DILIGENCE', sector: 'Robotics', geography: 'EU', deal_lead_id: 'lead-2' },
];

export const analyticsTransitionFixtures = [
  { company_id: 'c1', from_stage: null, to_stage: 'SOURCED', days_in_stage: 10 },
  { company_id: 'c1', from_stage: 'SOURCED', to_stage: 'SCREENING', days_in_stage: 7 },
  { company_id: 'c2', from_stage: 'SOURCED', to_stage: 'SCREENING', days_in_stage: 5 },
];
