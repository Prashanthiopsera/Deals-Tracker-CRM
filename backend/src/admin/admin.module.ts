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
import { SecretsManagerAuth0Client } from './auth0-management.client';

const eventsMock = {
  publishRoleChanged: async () => undefined,
  publishUserDeactivated: async () => undefined,
};

@Module({
  imports: [AuthModule, AuthorizationModule, AuditModule],
  controllers: [AdminUsersController, AdminAuditLogsController],
  providers: [
    SecretsManagerAuth0Client,
    {
      provide: AdminAuditLogsService,
      useFactory: (audit: AuditService, repo: InMemoryAuditLogRepository) =>
        new AdminAuditLogsService(repo, audit),
      inject: [AuditService, InMemoryAuditLogRepository],
    },
    {
      provide: AdminUsersService,
      useFactory: (auth0: SecretsManagerAuth0Client, audit: AuditService) =>
        new AdminUsersService(auth0, audit, eventsMock),
      inject: [SecretsManagerAuth0Client, AuditService],
    },
  ],
})
export class AdminModule {}
