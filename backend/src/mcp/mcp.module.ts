import { Module } from '@nestjs/common';
import { McpHealthController } from './mcp-health.controller';
import { McpToolRegistry, McpTransportService } from './mcp-server.service';

@Module({
  controllers: [McpHealthController],
  providers: [McpToolRegistry, McpTransportService],
  exports: [McpToolRegistry, McpTransportService],
})
export class McpModule {}
