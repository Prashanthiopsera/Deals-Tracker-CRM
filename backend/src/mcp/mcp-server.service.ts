import { Injectable, OnModuleInit } from '@nestjs/common';

export type McpTransportMode = 'stdio' | 'sse';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

@Injectable()
export class McpToolRegistry implements OnModuleInit {
  private readonly tools = new Map<string, McpToolDefinition>();
  private startedAt = Date.now();

  onModuleInit(): void {
    this.register({
      name: 'search_companies',
      description: 'Search companies in the CRM',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (input) => ({ results: [], query: input.query }),
    });
  }

  register(tool: McpToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  list(): McpToolDefinition[] {
    return [...this.tools.values()];
  }

  get(name: string): McpToolDefinition | undefined {
    return this.tools.get(name);
  }

  uptimeMs(): number {
    return Date.now() - this.startedAt;
  }
}

@Injectable()
export class McpTransportService {
  constructor(private readonly registry: McpToolRegistry) {}

  initialize(mode: McpTransportMode): { mode: McpTransportMode; tools: number } {
    return { mode, tools: this.registry.list().length };
  }
}
