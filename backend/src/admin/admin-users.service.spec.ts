import { AdminUsersService } from './admin-users.service';
import { UserRole } from '../database/enums';

describe('AdminUsersService', () => {
  const auth0 = {
    inviteUser: jest.fn(async () => ({ auth0Subject: 'auth0|1' })),
    updateRole: jest.fn(async () => undefined),
    deactivateUser: jest.fn(async () => undefined),
  };
  const audit = { log: jest.fn(async () => undefined) };
  const events = {
    publishRoleChanged: jest.fn(async () => undefined),
    publishUserDeactivated: jest.fn(async () => undefined),
  };

  it('invites, changes role, and deactivates users with audit events', async () => {
    const service = new AdminUsersService(auth0, audit, events);
    const invited = await service.invite('a@test.com', 'Alice', UserRole.ASSOCIATE, 'admin-1');
    expect(invited.status).toBe('pending');
    await service.changeRole(invited.id, UserRole.PRINCIPAL, 'admin-1');
    expect(events.publishRoleChanged).toHaveBeenCalled();
    await service.deactivate(invited.id, 'admin-1');
    expect(events.publishUserDeactivated).toHaveBeenCalled();
    expect(service.list({ status: 'inactive' })).toHaveLength(1);
  });
});
