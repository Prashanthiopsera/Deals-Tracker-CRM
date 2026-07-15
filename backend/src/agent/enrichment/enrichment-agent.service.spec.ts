import { filterDlpEgress } from './dlp-egress.filter';
import { mapEnrichmentToCrmFields } from './enrichment-field-mapper';
import { EnrichmentConnectorsService } from './enrichment-connectors.service';

describe('Enrichment (WO-090)', () => {
  const connectors = new EnrichmentConnectorsService();

  it('maps ZoomInfo and Apollo data to CRM fields', async () => {
    const sources = await Promise.all([
      connectors.fetchZoomInfo('Acme'),
      connectors.fetchApollo('Acme'),
    ]);
    const mapped = mapEnrichmentToCrmFields(sources);
    expect(mapped.sector).toBe('Robotics');
    expect(mapped.sources).toEqual(['zoominfo', 'apollo']);
  });

  it('applies DLP egress filtering to outbound payloads', () => {
    const filtered = filterDlpEgress({
      contacts: [{ email: 'secret@example.com', name: 'Jane' }],
    }) as { contacts: Array<{ email: string; name: string }> };
    expect(filtered.contacts[0].email).toBe('[REDACTED]');
    expect(filtered.contacts[0].name).toBe('Jane');
  });

  it('opens circuit breaker after repeated ZoomInfo failures', async () => {
    await expect(connectors.fetchZoomInfo('__FAIL_ZOOMINFO__')).rejects.toThrow();
    for (let i = 0; i < 4; i += 1) {
      await expect(connectors.fetchZoomInfo('__FAIL_ZOOMINFO__')).rejects.toThrow();
    }
    expect(connectors['zoomInfoBreaker'].state).toBe('open');
  });
});
