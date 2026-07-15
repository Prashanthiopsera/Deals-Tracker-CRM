import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../database/enums';

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  auth0Subject?: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface Auth0ManagementClient {
  inviteUser(email: string, role: UserRole): Promise<{ auth0Subject: string }>;
  updateRole(auth0Subject: string, role: UserRole): Promise<void>;
  deactivateUser(auth0Subject: string): Promise<void>;
  revokeSessions(auth0Subject: string): Promise<void>;
}

export interface EventPublisher {
  publishRoleChanged(userId: string): Promise<void>;
  publishUserDeactivated(userId: string): Promise<void>;
}

export interface AdminUserListQuery {
  role?: UserRole;
  status?: AdminUserRecord['status'];
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AdminUsersService {
  private readonly users: AdminUserRecord[] = [];

  constructor(
    private readonly auth0: Auth0ManagementClient,
    private readonly audit: AuditService,
    private readonly events: EventPublisher,
  ) {}

  seedUsers(records: AdminUserRecord[]): void {
    this.users.length = 0;
    this.users.push(...records);
  }

  async invite(
    email: string,
    fullName: string,
    role: UserRole,
    actorId: string,
    actorRole: string,
  ): Promise<AdminUserRecord> {
    this.assertAdmin(actorRole);
    const auth0 = await this.auth0.inviteUser(email, role);
    const user: AdminUserRecord = {
      id: randomUUID(),
      email,
      fullName,
      role,
      status: 'pending',
      auth0Subject: auth0.auth0Subject,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    this.users.push(user);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'create',
      resourceType: 'User',
      resourceId: user.id,
      afterState: user as unknown as Record<string, unknown>,
      metadata: { action: 'user.invite' },
    });
    return user;
  }

  async changeRole(
    userId: string,
    role: UserRole,
    actorId: string,
    actorRole: string,
  ): Promise<AdminUserRecord> {
    this.assertAdmin(actorRole);
    const user = this.requireUser(userId);
    const before = { ...user };
    user.role = role;
    if (user.auth0Subject) {
      await this.auth0.updateRole(user.auth0Subject, role);
    }
    await this.events.publishRoleChanged(userId);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'User',
      resourceId: userId,
      beforeState: before as unknown as Record<string, unknown>,
      afterState: user as unknown as Record<string, unknown>,
      metadata: { action: 'user.role_change' },
    });
    return user;
  }

  async deactivate(userId: string, actorId: string, actorRole: string): Promise<AdminUserRecord> {
    this.assertAdmin(actorRole);
    const user = this.requireUser(userId);
    const before = { ...user };
    user.status = 'inactive';
    if (user.auth0Subject) {
      await this.auth0.deactivateUser(user.auth0Subject);
      await this.auth0.revokeSessions(user.auth0Subject);
    }
    await this.events.publishUserDeactivated(userId);
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'User',
      resourceId: userId,
      beforeState: before as unknown as Record<string, unknown>,
      afterState: user as unknown as Record<string, unknown>,
      metadata: { action: 'user.deactivate' },
    });
    return user;
  }

  async reactivate(userId: string, actorId: string, actorRole: string): Promise<AdminUserRecord> {
    this.assertAdmin(actorRole);
    const user = this.requireUser(userId);
    const before = { ...user };
    user.status = 'active';
    this.audit.publishAuditEvent({
      actorId,
      actorRole,
      operation: 'update',
      resourceType: 'User',
      resourceId: userId,
      beforeState: before as unknown as Record<string, unknown>,
      afterState: user as unknown as Record<string, unknown>,
      metadata: { action: 'user.reactivate' },
    });
    return user;
  }

  list(query: AdminUserListQuery = {}): {
    items: AdminUserRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize ?? 50), 1), 200);
    const filtered = this.users.filter((user) => {
      if (query.role && user.role !== query.role) return false;
      if (query.status && user.status !== query.status) return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    const total = filtered.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  private assertAdmin(actorRole: string): void {
    if (actorRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  private requireUser(userId: string): AdminUserRecord {
    const user = this.users.find((entry) => entry.id === userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
