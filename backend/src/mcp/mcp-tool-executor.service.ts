import { HttpException, Injectable } from '@nestjs/common';
import { McpAuthService, McpPermissionDeniedError, McpUserContext } from './mcp-auth.service';
import { McpObservabilityService } from './mcp-observability.service';
import { mcpToolSchemas } from './mcp-tool-schemas';
import { McpToolResponse } from './mcp-tool-schemas';
import { McpToolsService } from './mcp-tools.service';

@Injectable()
export class McpToolExecutorService {
  constructor(
    private readonly auth: McpAuthService,
    private readonly tools: McpToolsService,
    private readonly observability: McpObservabilityService,
  ) {}

  async execute(
    token: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    const started = Date.now();
    const correlationId = String(input._correlation_id ?? `mcp-${Date.now()}`);
    let context: McpUserContext;
    try {
      context = await this.auth.authorizeToolCall(token, toolName);
      this.observability.assertRateLimit(context.userId);
    } catch (error) {
      if (error instanceof McpPermissionDeniedError) {
        return { success: false, error: { code: error.code, message: error.message } };
      }
      if (error instanceof Error && error.message === 'AUTH_FAILED') {
        return { success: false, error: { code: 'AUTH_FAILED', message: 'Authentication failed' } };
      }
      if (error instanceof HttpException) {
        const body = error.getResponse() as { code?: string; message?: string; retryAfter?: number };
        return {
          success: false,
          error: {
            code: body.code ?? 'RATE_LIMITED',
            message: body.message ?? 'Rate limit exceeded',
          },
        };
      }
      throw error;
    }

    switch (toolName) {
      case 'search_companies':
        return this.finish(context, toolName, correlationId, started, () =>
          this.tools.searchCompanies(context, input),
        );
      case 'get_record':
        return this.finish(context, toolName, correlationId, started, () =>
          this.tools.getRecord(context, input),
        );
      case 'create_record':
        return this.finish(context, toolName, correlationId, started, () =>
          this.tools.createRecord(context, input),
        );
      case 'update_fields':
        return this.finish(context, toolName, correlationId, started, () =>
          this.tools.updateFields(context, input),
        );
      case 'reassign_owner':
        return this.finish(context, toolName, correlationId, started, () =>
          this.tools.reassignOwner(context, input),
        );
      default:
        return { success: false, error: { code: 'UNKNOWN_TOOL', message: 'Tool not found' } };
    }
  }

  private async finish(
    context: McpUserContext,
    toolName: string,
    correlationId: string,
    started: number,
    handler: () => Promise<McpToolResponse>,
  ): Promise<McpToolResponse> {
    const result = await handler();
    this.observability.recordToolCall({
      correlation_id: correlationId,
      user_id: context.userId,
      tool_name: toolName,
      latency_ms: Date.now() - started,
      status_code: result.success ? 200 : 403,
    });
    return result;
  }

  toolDefinitions() {
    return Object.entries(mcpToolSchemas).map(([name, inputSchema]) => ({
      name,
      inputSchema,
    }));
  }
}
