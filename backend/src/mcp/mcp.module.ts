import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { McpAuthService, InMemoryMcpAuthTokenValidator } from './mcp-auth.service';
import { McpHealthController } from './mcp-health.controller';
import { McpToolRegistry, McpTransportService } from './mcp-server.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [McpHealthController],
  providers: [
    McpToolRegistry,
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
  ],
  exports: [McpToolRegistry, McpTransportService, McpAuthService],
})
export class McpModule {}
