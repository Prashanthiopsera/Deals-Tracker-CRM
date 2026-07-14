import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  InMemoryCedarCache,
  LayeredCedarCache,
  RedisCedarCache,
} from './cedar-cache';
import { CedarGuard } from './cedar.guard';
import { CedarAuthorizationService, VerifiedPermissionsClient } from './cedar.service';

@Module({
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
      useFactory: (client: VerifiedPermissionsClient, cache: LayeredCedarCache) =>
        new CedarAuthorizationService(client, cache),
      inject: [VerifiedPermissionsClient, LayeredCedarCache],
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
