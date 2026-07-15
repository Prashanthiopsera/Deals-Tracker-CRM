export const zoomInfoEnrichmentFixture = {
  company_name: 'Acme Robotics',
  industry: 'Robotics',
  hq_country: 'US',
  website: 'https://acme.example',
  funding_stage: 'Series B',
  description: 'Industrial automation platform',
  contacts: [{ name: 'Jane Doe', email: 'jane@acme.example', phone: '+1-555-0100' }],
};

export const apolloEnrichmentFixture = {
  organization: {
    name: 'Acme Robotics',
    industry: 'Robotics',
    country: 'United States',
    website_url: 'https://acme.example',
    latest_funding_stage: 'series_b',
    short_description: 'Industrial automation platform',
    key_contacts: [{ full_name: 'John Smith', email: 'john@acme.example' }],
  },
};

export const mergedEnrichmentProposal = {
  sector: 'Robotics',
  geography: 'US',
  website: 'https://acme.example',
  funding_stage: 'Series B',
  description: 'Industrial automation platform',
  key_contacts: [
    { name: 'Jane Doe', email: '[REDACTED]', pii: true },
    { name: 'John Smith', email: '[REDACTED]', pii: true },
  ],
  sources: ['zoominfo', 'apollo'],
};
