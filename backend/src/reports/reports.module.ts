import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ReportsController } from './reports.controller';
import { ReportGenerationService } from './report-generation.service';

@Module({
  imports: [AuditModule, AuthorizationModule, AnalyticsModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: ReportGenerationService,
      useFactory: (audit: AuditService, analytics: AnalyticsService) =>
        new ReportGenerationService(audit, analytics),
      inject: [AuditService, AnalyticsService],
    },
  ],
  exports: [ReportGenerationService],
})
export class ReportsModule {}
