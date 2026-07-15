import { McpToolRegistry, McpTransportService } from './mcp-server.service';

describe('McpServer (WO-084)', () => {
  const registry = new McpToolRegistry();
  const transport = new McpTransportService(registry);

  beforeEach(() => {
    registry.onModuleInit();
  });

  it('registers tools via declarative framework', () => {
    expect(registry.list().length).toBeGreaterThan(0);
    expect(registry.get('search_companies')?.inputSchema).toBeDefined();
  });

  it('initializes stdio and sse transport modes', () => {
    expect(transport.initialize('stdio').mode).toBe('stdio');
    expect(transport.initialize('sse').mode).toBe('sse');
  });

  it('reports uptime and tool count for health checks', () => {
    expect(registry.uptimeMs()).toBeGreaterThanOrEqual(0);
    expect(registry.list().length).toBe(1);
  });
});
