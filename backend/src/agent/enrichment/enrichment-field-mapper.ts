import { EnrichmentSourceData } from './enrichment-connectors.service';

export function mapEnrichmentToCrmFields(sources: EnrichmentSourceData[]): Record<string, unknown> {
  const zoom = sources.find((s) => s.source === 'zoominfo')?.data ?? {};
  const apolloOrg = (sources.find((s) => s.source === 'apollo')?.data.organization ??
    {}) as Record<string, unknown>;

  return {
    sector: zoom.industry ?? apolloOrg.industry ?? null,
    geography: zoom.hq_country ?? apolloOrg.country ?? null,
    website: zoom.website ?? apolloOrg.website_url ?? null,
    funding_stage: zoom.funding_stage ?? apolloOrg.latest_funding_stage ?? null,
    description: zoom.description ?? apolloOrg.short_description ?? null,
    key_contacts: mergeContacts(zoom.contacts, apolloOrg.key_contacts),
    sources: sources.map((s) => s.source),
  };
}

function mergeContacts(zoomContacts: unknown, apolloContacts: unknown): unknown[] {
  const contacts: unknown[] = [];
  if (Array.isArray(zoomContacts)) contacts.push(...zoomContacts);
  if (Array.isArray(apolloContacts)) contacts.push(...apolloContacts);
  return contacts.map((contact) => {
    if (contact && typeof contact === 'object') {
      return { ...(contact as Record<string, unknown>), pii: true };
    }
    return contact;
  });
}
