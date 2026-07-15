export type ConnectorLifecycleState =
  | 'registered'
  | 'configured'
  | 'enabled'
  | 'disabled'
  | 'error';

export interface ConnectorExecutionContext {
  connectorId: string;
  operation: string;
}

export interface ConnectorHealthResult {
  healthy: boolean;
  message?: string;
}

export interface IConnectorAdapter {
  initialize(config: Record<string, unknown>): Promise<void>;
  healthCheck(): Promise<ConnectorHealthResult>;
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  shutdown(): Promise<void>;
}

export interface ConnectorRegistration {
  id: string;
  type: string;
  state: ConnectorLifecycleState;
  config: Record<string, unknown>;
  adapter: IConnectorAdapter;
}
