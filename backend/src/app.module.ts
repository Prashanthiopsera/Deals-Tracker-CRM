import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { PiiModule } from './pii/pii.module';
import { AiModule } from './ai/ai.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SearchModule } from './search/search.module';
import { RagModule } from './rag/rag.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    ObservabilityModule,
    DatabaseModule,
    AuthModule,
    AuditModule,
    AuthorizationModule,
    PiiModule,
    AiModule,
    ComplianceModule,
    SearchModule,
    RagModule,
    AdminModule,
    CompaniesModule,
    HealthModule,
  ],
})
export class AppModule {}
