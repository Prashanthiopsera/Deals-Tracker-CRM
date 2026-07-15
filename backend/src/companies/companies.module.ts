import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { InMemoryAuditQueuePublisher } from '../audit/authorization-audit.publisher';
import { Company } from '../database/entities/company.entity';
import { User } from '../database/entities/user.entity';
import { CompanyOwnershipService } from './company-ownership.service';
import { CompaniesController } from './companies.controller';
import { CompaniesInMemoryService } from './companies-in-memory.service';
import { CompaniesService, SqsCompanyAuditPublisher } from './companies.service';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User]), AuditModule],
  controllers: [CompaniesController],
  providers: [
    CompaniesInMemoryService,
    CompanyOwnershipService,
    OwnershipFieldInterceptor,
    OwnershipPatchGuard,
    {
      provide: SqsCompanyAuditPublisher,
      useFactory: (audit: AuditService) => new SqsCompanyAuditPublisher(audit),
      inject: [AuditService],
    },
    {
      provide: CompaniesService,
      useFactory: (
        repo: Repository<Company>,
        audit: SqsCompanyAuditPublisher,
        memory: CompaniesInMemoryService,
      ) =>
        process.env.COMPANIES_IN_MEMORY === 'true'
          ? memory
          : new CompaniesService(repo, audit),
      inject: [getRepositoryToken(Company), SqsCompanyAuditPublisher, CompaniesInMemoryService],
    },
  ],
  exports: [OwnershipFieldInterceptor, CompaniesService],
})
export class CompaniesModule {}
