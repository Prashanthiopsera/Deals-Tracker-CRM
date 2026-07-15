import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from '../../mcp/mcp-circuit-breaker';
import {
  apolloEnrichmentFixture,
  zoomInfoEnrichmentFixture,
} from '../../../test-fixtures/enrichment/enrichment.fixture';
import { filterDlpEgress } from './dlp-egress.filter';

export interface EnrichmentSourceData {
  source: 'zoominfo' | 'apollo';
  data: Record<string, unknown>;
}

@Injectable()
export class EnrichmentConnectorsService {
  private readonly zoomInfoBreaker = new CircuitBreaker({
    failureThreshold: 5,
    windowMs: 60_000,
    halfOpenAfterMs: 30_000,
  });
  private readonly apolloBreaker = new CircuitBreaker({
    failureThreshold: 5,
    windowMs: 60_000,
    halfOpenAfterMs: 30_000,
  });

  async fetchZoomInfo(companyName: string): Promise<EnrichmentSourceData> {
    if (companyName === '__FAIL_ZOOMINFO__') {
      await this.zoomInfoBreaker.execute(() => Promise.reject(new Error('ZoomInfo unavailable')));
    }
    const data = filterDlpEgress(zoomInfoEnrichmentFixture as Record<string, unknown>);
    return { source: 'zoominfo', data: data as Record<string, unknown> };
  }

  async fetchApollo(companyName: string): Promise<EnrichmentSourceData> {
    if (companyName === '__FAIL_APOLLO__') {
      await this.apolloBreaker.execute(() => Promise.reject(new Error('Apollo unavailable')));
    }
    const data = filterDlpEgress(apolloEnrichmentFixture as Record<string, unknown>);
    return { source: 'apollo', data: data as Record<string, unknown> };
  }
}
