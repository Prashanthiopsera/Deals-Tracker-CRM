import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { InMemoryAuditLogRepository } from '../audit/audit-log.repository';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuthModule } from '../auth/auth.module';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { AdminConnectorsController } from './admin-connectors.controller';
import {
  AdminConnectorsService,
  InMemorySecretsManagerClient,
} from './admin-connectors.service';
import { AdminPoliciesController } from './admin-policies.controller';
import {
  AdminPoliciesService,
  InMemoryVerifiedPermissionsAdminClient,
} from './admin-policies.service';
import { AdminDsarController } from './admin-dsar.controller';
import { AdminDlpPolicyService } from './admin-dlp-policy.service';
import {
  AdminDsarService,
  InMemoryDsarObjectStore,
} from './admin-dsar.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { SecretsManagerAuth0Client } from './auth0-management.client';
import { PiiModule } from '../pii/pii.module';
import { PiiRegistryService } from '../pii/pii-registry.service';

const eventsMock = {
  publishRoleChanged: async () => undefined,
  publishUserDeactivated: async () => undefined,
};

@Module({
  imports: [AuthModule, AuthorizationModule, AuditModule, PiiModule],
  controllers: [
    AdminUsersController,
    AdminAuditLogsController,
    AdminPoliciesController,
    AdminConnectorsController,
    AdminDsarController,
  ],
  providers: [
    SecretsManagerAuth0Client,
    InMemoryVerifiedPermissionsAdminClient,
    InMemorySecretsManagerClient,
    InMemoryDsarObjectStore,
    AdminDlpPolicyService,
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
    {
      provide: AdminPoliciesService,
      useFactory: (avp: InMemoryVerifiedPermissionsAdminClient, audit: AuditService) =>
        new AdminPoliciesService(avp, audit),
      inject: [InMemoryVerifiedPermissionsAdminClient, AuditService],
    },
    {
      provide: AdminConnectorsService,
      useFactory: (secrets: InMemorySecretsManagerClient, audit: AuditService) =>
        new AdminConnectorsService(secrets, audit),
      inject: [InMemorySecretsManagerClient, AuditService],
    },
    {
      provide: AdminDsarService,
      useFactory: (
        piiRegistry: PiiRegistryService,
        audit: AuditService,
        objectStore: InMemoryDsarObjectStore,
      ) => new AdminDsarService(piiRegistry, audit, objectStore),
      inject: [PiiRegistryService, AuditService, InMemoryDsarObjectStore],
    },
  ],
})
export class AdminModule {}
