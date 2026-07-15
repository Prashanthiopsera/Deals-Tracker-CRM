import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { McpAuthService, InMemoryMcpAuthTokenValidator } from './mcp-auth.service';
import { McpHealthController } from './mcp-health.controller';
import { McpObservabilityService, InMemoryMcpMetricPublisher, McpRateLimiter } from './mcp-observability.service';
import { McpToolExecutorService } from './mcp-tool-executor.service';
import { McpToolRegistry, McpTransportService } from './mcp-server.service';
import { McpToolsService } from './mcp-tools.service';

@Module({
  imports: [AuditModule, AuthorizationModule, CompaniesModule],
  controllers: [McpHealthController],
  providers: [
    McpTransportService,
    InMemoryMcpAuthTokenValidator,
    {
      provide: McpAuthService,
      useFactory: (
        cedar: CedarAuthorizationService,
        audit: AuditService,
        validator: InMemoryMcpAuthTokenValidator,
      ) => new McpAuthService(cedar, audit, validator),
      inject: [CedarAuthorizationService, AuditService, InMemoryMcpAuthTokenValidator],
    },
    {
      provide: McpToolsService,
      useFactory: (companies: CompaniesService, audit: AuditService) =>
        new McpToolsService(companies, audit),
      inject: [CompaniesService, AuditService],
    },
    McpRateLimiter,
    InMemoryMcpMetricPublisher,
    McpObservabilityService,
    {
      provide: McpToolExecutorService,
      useFactory: (
        auth: McpAuthService,
        tools: McpToolsService,
        observability: McpObservabilityService,
      ) => new McpToolExecutorService(auth, tools, observability),
      inject: [McpAuthService, McpToolsService, McpObservabilityService],
    },
    {
      provide: McpToolRegistry,
      useFactory: (executor: McpToolExecutorService) => new McpToolRegistry(executor),
      inject: [McpToolExecutorService],
    },
  ],
  exports: [McpToolRegistry, McpTransportService, McpAuthService, McpToolExecutorService],
})
export class McpModule {}
