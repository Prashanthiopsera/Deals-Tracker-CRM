import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserRole } from '../database/enums';

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
}

export interface Auth0ManagementClient {
  inviteUser(email: string, role: UserRole): Promise<{ auth0Subject: string }>;
  updateRole(auth0Subject: string, role: UserRole): Promise<void>;
  deactivateUser(auth0Subject: string): Promise<void>;
}

export interface AuditLogger {
  log(entry: Record<string, unknown>): Promise<void>;
}

export interface EventPublisher {
  publishRoleChanged(userId: string): Promise<void>;
  publishUserDeactivated(userId: string): Promise<void>;
}

@Injectable()
export class AdminUsersService {
  private readonly users: AdminUserRecord[] = [];

  constructor(
    private readonly auth0: Auth0ManagementClient,
    private readonly audit: AuditLogger,
    private readonly events: EventPublisher,
  ) {}

  async invite(email: string, fullName: string, role: UserRole, actorId: string): Promise<AdminUserRecord> {
    const auth0 = await this.auth0.inviteUser(email, role);
    const user: AdminUserRecord = {
      id: randomUUID(),
      email,
      fullName,
      role,
      status: 'pending',
    };
    this.users.push(user);
    await this.audit.log({ action: 'user.invite', actorId, targetUserId: user.id, role });
    return user;
  }

  async changeRole(userId: string, role: UserRole, actorId: string): Promise<AdminUserRecord> {
    const user = this.requireUser(userId);
    const before = { ...user };
    user.role = role;
    await this.auth0.updateRole(user.id, role);
    await this.events.publishRoleChanged(userId);
    await this.audit.log({ action: 'user.role_change', actorId, targetUserId: userId, before, after: user });
    return user;
  }

  async deactivate(userId: string, actorId: string): Promise<AdminUserRecord> {
    const user = this.requireUser(userId);
    user.status = 'inactive';
    await this.auth0.deactivateUser(user.id);
    await this.events.publishUserDeactivated(userId);
    await this.audit.log({ action: 'user.deactivate', actorId, targetUserId: userId });
    return user;
  }

  list(filter?: { role?: UserRole; status?: AdminUserRecord['status'] }): AdminUserRecord[] {
    return this.users.filter((user) => {
      if (filter?.role && user.role !== filter.role) return false;
      if (filter?.status && user.status !== filter.status) return false;
      return true;
    });
  }

  private requireUser(userId: string): AdminUserRecord {
    const user = this.users.find((entry) => entry.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}
