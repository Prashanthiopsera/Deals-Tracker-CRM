import { Module } from '@nestjs/common';
import {
  CedarAuthorizationService,
  InMemoryCedarCache,
  VerifiedPermissionsClient,
} from './cedar.service';
import { CedarGuard } from './cedar.guard';

@Module({
  providers: [
    InMemoryCedarCache,
    VerifiedPermissionsClient,
    CedarAuthorizationService,
    CedarGuard,
  ],
  exports: [CedarAuthorizationService, CedarGuard],
})
export class AuthorizationModule {}
