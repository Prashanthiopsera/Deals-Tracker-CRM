import { Injectable } from '@nestjs/common';
import { McpAuthService, McpPermissionDeniedError, McpUserContext } from './mcp-auth.service';
import { mcpToolSchemas } from './mcp-tool-schemas';
import { McpToolResponse } from './mcp-tool-schemas';
import { McpToolsService } from './mcp-tools.service';

@Injectable()
export class McpToolExecutorService {
  constructor(
    private readonly auth: McpAuthService,
    private readonly tools: McpToolsService,
  ) {}

  async execute(
    token: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<McpToolResponse> {
    let context: McpUserContext;
    try {
      context = await this.auth.authorizeToolCall(token, toolName);
    } catch (error) {
      if (error instanceof McpPermissionDeniedError) {
        return { success: false, error: { code: error.code, message: error.message } };
      }
      if (error instanceof Error && error.message === 'AUTH_FAILED') {
        return { success: false, error: { code: 'AUTH_FAILED', message: 'Authentication failed' } };
      }
      throw error;
    }

    switch (toolName) {
      case 'search_companies':
        return this.tools.searchCompanies(context, input);
      case 'get_record':
        return this.tools.getRecord(context, input);
      case 'create_record':
        return this.tools.createRecord(context, input);
      case 'update_fields':
        return this.tools.updateFields(context, input);
      case 'reassign_owner':
        return this.tools.reassignOwner(context, input);
      default:
        return { success: false, error: { code: 'UNKNOWN_TOOL', message: 'Tool not found' } };
    }
  }

  toolDefinitions() {
    return Object.entries(mcpToolSchemas).map(([name, inputSchema]) => ({
      name,
      inputSchema,
    }));
  }
}
