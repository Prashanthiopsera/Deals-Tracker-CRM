import { ForbiddenException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { AdminUsersService } from './admin-users.service';
import { buildAdminUserFixtures } from '../../test-fixtures/users/admin-users.fixture';
import { UserRole } from '../database/enums';

describe('AdminUsersService (WO-055)', () => {
  const auth0 = {
    inviteUser: jest.fn(async () => ({ auth0Subject: 'auth0|1' })),
    updateRole: jest.fn(async () => undefined),
    deactivateUser: jest.fn(async () => undefined),
    revokeSessions: jest.fn(async () => undefined),
  };
  const { queue, service: audit } = createAuditTestStack();
  const events = {
    publishRoleChanged: jest.fn(async () => undefined),
    publishUserDeactivated: jest.fn(async () => undefined),
  };
  const service = new AdminUsersService(auth0, audit, events);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    jest.clearAllMocks();
    service.seedUsers(buildAdminUserFixtures() as never);
  });

  it('returns paginated users filtered by role and status', () => {
    const result = service.list({ role: UserRole.ASSOCIATE, page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('invites, changes role, deactivates, and reactivates users with audit events', async () => {
    const invited = await service.invite(
      'new@p7vc.test',
      'New User',
      UserRole.ASSOCIATE,
      'admin-1',
      'Admin',
    );
    expect(invited.status).toBe('pending');
    expect(queue.domainMessages[0].metadata).toMatchObject({ action: 'user.invite' });

    await service.changeRole(invited.id, UserRole.PRINCIPAL, 'admin-1', 'Admin');
    expect(events.publishRoleChanged).toHaveBeenCalled();

    await service.deactivate(invited.id, 'admin-1', 'Admin');
    expect(auth0.revokeSessions).toHaveBeenCalled();
    expect(events.publishUserDeactivated).toHaveBeenCalled();

    const reactivated = await service.reactivate(invited.id, 'admin-1', 'Admin');
    expect(reactivated.status).toBe('active');
  });

  it('rejects non-admin actors', async () => {
    await expect(
      service.invite('x@test.com', 'X', UserRole.INTERN, 'u1', 'Director'),
    ).rejects.toThrow(ForbiddenException);
  });
});
