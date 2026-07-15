import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { McpAuthService, InMemoryMcpAuthTokenValidator } from './mcp-auth.service';
import { McpHealthController } from './mcp-health.controller';
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
    {
      provide: McpToolExecutorService,
      useFactory: (auth: McpAuthService, tools: McpToolsService) =>
        new McpToolExecutorService(auth, tools),
      inject: [McpAuthService, McpToolsService],
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
