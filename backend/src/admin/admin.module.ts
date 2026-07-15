import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { InMemoryAuditLogRepository } from '../audit/audit-log.repository';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

const auth0Mock = {
  inviteUser: async () => ({ auth0Subject: 'auth0|mock' }),
  updateRole: async () => undefined,
  deactivateUser: async () => undefined,
};

const auditMock = { log: async () => undefined };
const eventsMock = {
  publishRoleChanged: async () => undefined,
  publishUserDeactivated: async () => undefined,
};

@Module({
  imports: [AuthModule, AuthorizationModule, AuditModule],
  controllers: [AdminUsersController, AdminAuditLogsController],
  providers: [
    {
      provide: AdminAuditLogsService,
      useFactory: (audit: AuditService, repo: InMemoryAuditLogRepository) =>
        new AdminAuditLogsService(repo, audit),
      inject: [AuditService, InMemoryAuditLogRepository],
    },
    {
      provide: AdminUsersService,
      useFactory: () => new AdminUsersService(auth0Mock, auditMock, eventsMock),
    },
  ],
})
export class AdminModule {}
