import { createAuditTestStack } from '../audit/audit-test.utils';
import { InMemorySecretsManagerClient } from './admin-connectors.service';
import { AdminConnectorsService } from './admin-connectors.service';
import { AdminDlpPolicyService } from './admin-dlp-policy.service';

describe('AdminConnectorHealth (WO-102)', () => {
  const { service: audit } = createAuditTestStack();
  const connectors = new AdminConnectorsService(new InMemorySecretsManagerClient(), audit);
  const dlpPolicies = new AdminDlpPolicyService();

  it('returns aggregated connector health metrics', () => {
    const health = connectors.aggregateHealth('Admin');
    expect(health.total).toBeGreaterThan(0);
    expect(health).toHaveProperty('healthy');
  });

  it('supports DLP policy CRUD for admins', () => {
    const created = dlpPolicies.upsert('Admin', {
      id: 'p3',
      pattern: 'phone',
      action: 'redact',
      connector_scope: 'slack',
    });
    expect(dlpPolicies.list('Admin')).toContainEqual(created);
  });
});
