import { ConnectorRegistry } from './connector.registry';
import { ConnectorCredentialService, InMemorySecretsManagerClient } from './connector-credential.service';
import { TestConnectorAdapter } from '../../test-fixtures/connectors/test-connector.adapter';

describe('ConnectorFramework (WO-095)', () => {
  it('registers connectors and invokes through circuit breaker', async () => {
    const registry = new ConnectorRegistry();
    registry.register({
      id: 'test-1',
      type: 'test',
      state: 'registered',
      config: {},
      adapter: new TestConnectorAdapter(),
    });
    const result = await registry.invoke('test-1', 'ping', {});
    expect(result.ok).toBe(true);
  });

  it('retrieves credentials from Secrets Manager stub', async () => {
    const secrets = new InMemorySecretsManagerClient();
    secrets.seed('connectors/zoominfo-1', { api_key: 'zi-key' });
    const credentials = new ConnectorCredentialService(secrets);
    await expect(credentials.getCredentials('zoominfo-1')).resolves.toEqual({ api_key: 'zi-key' });
  });
});
