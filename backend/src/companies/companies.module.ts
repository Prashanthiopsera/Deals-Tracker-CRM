import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, OwnershipFieldInterceptor, OwnershipPatchGuard],
  exports: [OwnershipFieldInterceptor],
})
export class CompaniesModule {}
