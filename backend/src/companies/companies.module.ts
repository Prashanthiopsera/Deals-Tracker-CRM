import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { Company } from '../database/entities/company.entity';
import { CompaniesController } from './companies.controller';
import { CompaniesService, SqsCompanyAuditPublisher } from './companies.service';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), AuditModule],
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    OwnershipFieldInterceptor,
    OwnershipPatchGuard,
    {
      provide: SqsCompanyAuditPublisher,
      useFactory: (queue: InMemoryAuditQueuePublisher) => new SqsCompanyAuditPublisher(queue),
      inject: [InMemoryAuditQueuePublisher],
    },
    {
      provide: 'CompanyAuditPublisher',
      useExisting: SqsCompanyAuditPublisher,
    },
  ],
  exports: [OwnershipFieldInterceptor],
})
export class CompaniesModule {}
