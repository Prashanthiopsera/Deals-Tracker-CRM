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
import { McpModule } from './mcp/mcp.module';
import { AgentModule } from './agent/agent.module';
import { ConnectorModule } from './connectors/connector.module';
import { ActivitiesModule } from './activities/activities.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommentsModule } from './comments/comments.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { ExportsModule } from './exports/exports.module';
import { ReportsModule } from './reports/reports.module';
import { DigestModule } from './digest/digest.module';
import { AutomationModule } from './automation/automation.module';
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
    McpModule,
    AgentModule,
    ConnectorModule,
    ActivitiesModule,
    AnalyticsModule,
    CommentsModule,
    CollaborationModule,
    NotificationsModule,
    DocumentsModule,
    ExportsModule,
    ReportsModule,
    DigestModule,
    AutomationModule,
    AdminModule,
    CompaniesModule,
    HealthModule,
  ],
})
export class AppModule {}
