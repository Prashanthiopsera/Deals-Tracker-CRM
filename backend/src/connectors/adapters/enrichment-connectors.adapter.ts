import { IConnectorAdapter, ConnectorHealthResult } from '../connector.types';
import { zoomInfoEnrichmentFixture } from '../../../test-fixtures/enrichment/enrichment.fixture';

export class ZoomInfoConnectorAdapter implements IConnectorAdapter {
  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true, message: 'ZoomInfo reachable' };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      proposals: [
        { field: 'sector', value: zoomInfoEnrichmentFixture.industry, confidence: 0.92, source: 'zoominfo' },
        { field: 'geography', value: zoomInfoEnrichmentFixture.hq_country, confidence: 0.9, source: 'zoominfo' },
      ],
      query: input.company_name,
    };
  }
  async shutdown(): Promise<void> {}
}

export class ApolloConnectorAdapter implements IConnectorAdapter {
  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true, message: 'Apollo reachable' };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      proposals: [
        {
          field: 'website',
          value: 'https://acme.example',
          confidence: 0.88,
          source: 'apollo',
        },
      ],
      query: input.domain ?? input.company_name,
    };
  }
  async shutdown(): Promise<void> {}
}
