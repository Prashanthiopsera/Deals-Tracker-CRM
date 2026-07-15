import { UnprocessableEntityException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import {
  AdminPoliciesService,
  InMemoryVerifiedPermissionsAdminClient,
} from './admin-policies.service';
import {
  INVALID_CEDAR_POLICY,
  VALID_CEDAR_POLICY,
} from '../../test-fixtures/policies/cedar-policy.fixture';

describe('AdminPoliciesService (WO-056)', () => {
  const avp = new InMemoryVerifiedPermissionsAdminClient();
  const { service: audit, queue } = createAuditTestStack();
  const service = new AdminPoliciesService(avp, audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
  });

  it('creates, reads, updates, and lists policies with version history', async () => {
    const created = await service.create('Director full access', VALID_CEDAR_POLICY, 'admin-1', 'Admin');
    const fetched = await service.get(created.id, 'Admin');
    expect(fetched.versions).toHaveLength(1);

    await service.update(created.id, `${VALID_CEDAR_POLICY}\n`, 'admin-1', 'Admin');
    const listed = await service.list(1, 10, 'Admin');
    expect(listed.items.length).toBeGreaterThan(0);
    expect(queue.domainMessages.length).toBeGreaterThan(0);
  });

  it('rejects invalid Cedar syntax with 422-style error', async () => {
    await expect(
      service.create('Bad policy', INVALID_CEDAR_POLICY, 'admin-1', 'Admin'),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});
