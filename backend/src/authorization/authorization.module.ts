import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationAuditService } from '../audit/authorization-audit.service';
import { APP_GUARD } from '@nestjs/core';
import {
  InMemoryCedarCache,
  LayeredCedarCache,
  RedisCedarCache,
} from './cedar-cache';
import { CedarGuard } from './cedar.guard';
import { CedarAuthorizationService, VerifiedPermissionsClient } from './cedar.service';

@Module({
  imports: [AuditModule],
  providers: [
    InMemoryCedarCache,
    RedisCedarCache,
    LayeredCedarCache,
    {
      provide: 'CedarCache',
      useExisting: LayeredCedarCache,
    },
    VerifiedPermissionsClient,
    {
      provide: CedarAuthorizationService,
      useFactory: (
        client: VerifiedPermissionsClient,
        cache: LayeredCedarCache,
        audit: AuthorizationAuditService,
      ) => new CedarAuthorizationService(client, cache, audit),
      inject: [VerifiedPermissionsClient, LayeredCedarCache, AuthorizationAuditService],
    },
    CedarGuard,
    {
      provide: APP_GUARD,
      useExisting: CedarGuard,
    },
  ],
  exports: [CedarAuthorizationService, CedarGuard],
})
export class AuthorizationModule {}
