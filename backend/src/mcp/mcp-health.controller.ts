import { Controller, Get } from '@nestjs/common';
import { McpToolRegistry } from './mcp-server.service';

@Controller('mcp/health')
export class McpHealthController {
  constructor(private readonly registry: McpToolRegistry) {}

  @Get()
  health() {
    return {
      status: 'ok',
      version: '0.1.0',
      uptimeMs: this.registry.uptimeMs(),
      toolCount: this.registry.list().length,
    };
  }
}
