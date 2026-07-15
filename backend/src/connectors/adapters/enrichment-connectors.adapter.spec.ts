import { TokenBucketRateLimiter } from '../connector-rate-limiter';
import { ZoomInfoConnectorAdapter, ApolloConnectorAdapter } from './enrichment-connectors.adapter';

describe('EnrichmentConnectorAdapters (WO-096)', () => {
  it('normalizes ZoomInfo enrichment proposals', async () => {
    const adapter = new ZoomInfoConnectorAdapter();
    const result = await adapter.execute({ company_name: 'Acme' });
    expect(result.proposals).toHaveLength(2);
  });

  it('normalizes Apollo enrichment proposals', async () => {
    const adapter = new ApolloConnectorAdapter();
    const result = await adapter.execute({ company_name: 'Acme' });
    expect(result.proposals.length).toBeGreaterThan(0);
  });

  it('enforces token bucket rate limits', () => {
    const limiter = new TokenBucketRateLimiter(2, 60_000);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(false);
  });
});
