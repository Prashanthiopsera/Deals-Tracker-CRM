import { Injectable } from '@nestjs/common';
import { CircuitBreaker } from '../mcp/mcp-circuit-breaker';
import {
  ConnectorExecutionContext,
  ConnectorRegistration,
  IConnectorAdapter,
} from './connector.types';

@Injectable()
export class ConnectorRegistry {
  private readonly connectors = new Map<string, ConnectorRegistration>();
  private readonly breakers = new Map<string, CircuitBreaker>();

  register(registration: ConnectorRegistration): void {
    this.connectors.set(registration.id, registration);
    this.breakers.set(
      registration.id,
      new CircuitBreaker({ failureThreshold: 5, windowMs: 60_000, halfOpenAfterMs: 30_000 }),
    );
  }

  unregister(id: string): void {
    this.connectors.delete(id);
    this.breakers.delete(id);
  }

  getConnector(id: string): ConnectorRegistration | undefined {
    return this.connectors.get(id);
  }

  listConnectors(): ConnectorRegistration[] {
    return [...this.connectors.values()].map((entry) => ({
      ...entry,
      adapter: entry.adapter,
    }));
  }

  async invoke(
    id: string,
    operation: string,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const registration = this.connectors.get(id);
    if (!registration) throw new Error(`Connector ${id} not found`);
    const breaker = this.breakers.get(id)!;
    const started = Date.now();
    try {
      const result = await breaker.execute(() => registration.adapter.execute({ ...input, operation }));
      this.logInvocation({ connectorId: id, connectorType: registration.type, operation, durationMs: Date.now() - started, status: 'ok' });
      return result;
    } catch (error) {
      this.logInvocation({
        connectorId: id,
        connectorType: registration.type,
        operation,
        durationMs: Date.now() - started,
        status: 'error',
      });
      registration.state = 'error';
      throw error;
    }
  }

  private logInvocation(context: ConnectorExecutionContext & { connectorType: string; durationMs: number; status: string }): void {
    // Structured connector log stub for CloudWatch
    void context;
  }
}
