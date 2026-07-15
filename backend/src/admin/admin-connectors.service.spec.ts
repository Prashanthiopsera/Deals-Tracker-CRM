import { ForbiddenException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import {
  AdminConnectorsService,
  InMemorySecretsManagerClient,
} from './admin-connectors.service';

describe('AdminConnectorsService (WO-058)', () => {
  const secrets = new InMemorySecretsManagerClient();
  const { service: audit } = createAuditTestStack();
  const service = new AdminConnectorsService(secrets, audit);

  it('lists connectors without exposing raw secrets', () => {
    const connectors = service.list('Admin');
    expect(connectors[0].credentialHint).toMatch(/\*\*\*\*/);
    expect(connectors).toHaveLength(3);
  });

  it('updates config, rotates credentials, and tests connectivity', async () => {
    await service.updateConfig('zoominfo-1', { enabled: true }, 'admin-1', 'Admin');
    const rotated = await service.rotateCredentials(
      'zoominfo-1',
      { api_key: 'secret-key-9f2a' },
      'admin-1',
      'Admin',
    );
    expect(rotated.credentialHint).toBe('****9f2a');
    const test = await service.testConnectivity('zoominfo-1', 'admin-1', 'Admin');
    expect(test.success).toBe(true);
  });

  it('denies non-admin access', () => {
    expect(() => service.list('Director')).toThrow(ForbiddenException);
  });
});
