import { ConnectorHealthResult, IConnectorAdapter } from '../../src/connectors/connector.types';

export class TestConnectorAdapter implements IConnectorAdapter {
  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { ok: true, echo: input.operation };
  }
  async shutdown(): Promise<void> {}
}
