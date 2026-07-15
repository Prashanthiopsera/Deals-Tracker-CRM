import { Injectable } from '@nestjs/common';

export interface SecretsManagerClient {
  getSecret(namespace: string): Promise<Record<string, string>>;
}

@Injectable()
export class InMemorySecretsManagerClient implements SecretsManagerClient {
  private readonly secrets = new Map<string, Record<string, string>>();

  seed(namespace: string, value: Record<string, string>): void {
    this.secrets.set(namespace, value);
  }

  async getSecret(namespace: string): Promise<Record<string, string>> {
    return this.secrets.get(namespace) ?? { api_key: 'mock-key' };
  }
}

@Injectable()
export class ConnectorCredentialService {
  constructor(private readonly secrets: InMemorySecretsManagerClient) {}

  async getCredentials(connectorId: string): Promise<Record<string, string>> {
    return this.secrets.getSecret(`connectors/${connectorId}`);
  }
}
