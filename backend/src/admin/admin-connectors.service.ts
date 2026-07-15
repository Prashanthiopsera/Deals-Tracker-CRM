import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { buildConnectorFixtures } from '../../test-fixtures/connectors/connectors.fixture';

export interface ConnectorRecord {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastSyncAt: string | null;
  healthStatus: 'healthy' | 'degraded' | 'offline';
  config: Record<string, unknown>;
  credentialHint: string | null;
}

export interface SecretsManagerClient {
  storeSecret(namespace: string, value: Record<string, string>): Promise<void>;
  getSecretHint(namespace: string): Promise<string | null>;
}

@Injectable()
export class AdminConnectorsService {
  private connectors: ConnectorRecord[] = buildConnectorFixtures();

  constructor(
    private readonly secrets: SecretsManagerClient,
    private readonly audit: AuditService,
  ) {}

  list(actorRole: string): ConnectorRecord[] {
    this.assertAdmin(actorRole);
    return this.connectors.map((connector) => ({ ...connector }));
  }

  get(id: string, actorRole: string): ConnectorRecord {
    this.assertAdmin(actorRole);
    return { ...this.requireConnector(id) };
  }

  async updateConfig(
    id: string,
    config: Record<string, unknown>,
    actorId: string,
    actorRole: string,
  ): Promise<ConnectorRecord> {
    this.assertAdmin(actorRole);
    const connector = this.requireConnector(id);
    const before = { ...connector.config };
    connector.config = { ...connector.config, ...config };
    if (typeof config.enabled === 'boolean') {
      connector.enabled = config.enabled;
    }
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'Connector',
      resourceId: id,
      beforeState: before,
      afterState: connector.config,
      metadata: { action: 'connector.config_update' },
    });
    return { ...connector };
  }

  aggregateHealth(actorRole: string) {
    this.assertAdmin(actorRole);
    const healthy = this.connectors.filter((c) => c.healthStatus === 'healthy').length;
    const degraded = this.connectors.filter((c) => c.healthStatus === 'degraded').length;
    const failed = this.connectors.filter((c) => c.healthStatus === 'offline').length;
    return {
      total: this.connectors.length,
      healthy,
      degraded,
      failed,
      dlp_violations_24h: 0,
      connectors: this.connectors.map((connector) => ({
        id: connector.id,
        name: connector.name,
        enabled: connector.enabled,
        healthStatus: connector.healthStatus,
        lastSyncAt: connector.lastSyncAt,
        circuit_breaker_state: 'closed',
      })),
    };
  }

  async rotateCredentials(
    id: string,
    credentials: Record<string, string>,
    actorId: string,
    actorRole: string,
  ): Promise<{ ok: true; credentialHint: string | null }> {
    this.assertAdmin(actorRole);
    const connector = this.requireConnector(id);
    await this.secrets.storeSecret(`connectors/${id}`, credentials);
    const hint = await this.secrets.getSecretHint(`connectors/${id}`);
    connector.credentialHint = hint;
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'Connector',
      resourceId: id,
      metadata: { action: 'connector.credentials_rotated' },
    });
    return { ok: true, credentialHint: hint };
  }

  async testConnectivity(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ success: boolean; message: string }> {
    this.assertAdmin(actorRole);
    const connector = this.requireConnector(id);
    const success = connector.enabled && connector.credentialHint !== null;
    connector.healthStatus = success ? 'healthy' : 'offline';
    connector.lastSyncAt = new Date().toISOString();
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'Connector',
      resourceId: id,
      metadata: { action: 'connector.test', success },
    });
    return {
      success,
      message: success ? 'Connectivity test passed' : 'Connector disabled or missing credentials',
    };
  }

  private requireConnector(id: string): ConnectorRecord {
    const connector = this.connectors.find((entry) => entry.id === id);
    if (!connector) throw new NotFoundException('Connector not found');
    return connector;
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
}

@Injectable()
export class InMemorySecretsManagerClient implements SecretsManagerClient {
  private readonly secrets = new Map<string, Record<string, string>>();

  async storeSecret(namespace: string, value: Record<string, string>): Promise<void> {
    this.secrets.set(namespace, value);
  }

  async getSecretHint(namespace: string): Promise<string | null> {
    const secret = this.secrets.get(namespace);
    if (!secret) return null;
    const first = Object.values(secret)[0];
    return first ? `****${first.slice(-4)}` : null;
  }
}
