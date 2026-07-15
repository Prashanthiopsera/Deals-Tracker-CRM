import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { McpToolExecutorService } from './mcp-tool-executor.service';
import { mcpToolSchemas } from './mcp-tool-schemas';

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

  constructor(@Optional() private readonly executor?: McpToolExecutorService) {}

  onModuleInit(): void {
    if (this.executor) {
      for (const { name, inputSchema } of this.executor.toolDefinitions()) {
        this.register({
          name,
          description: `CRM ${name.replace(/_/g, ' ')} tool`,
          inputSchema: inputSchema as Record<string, unknown>,
          handler: async (input) => {
            const token = String(input._token ?? 'Director:director-1');
            const { _token, ...params } = input;
            return this.executor!.execute(token, name, params);
          },
        });
      }
      return;
    }

    this.register({
      name: 'search_companies',
      description: 'Search companies in the CRM',
      inputSchema: mcpToolSchemas.search_companies as Record<string, unknown>,
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
