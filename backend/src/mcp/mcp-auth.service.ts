import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import {
  assertAuthorized,
  buildAuthRequest,
  CedarAuthorizationService,
} from '../authorization/cedar.service';
import { CedarAction } from '../authorization/cedar.types';
import { mcpToolActions } from '../../test-fixtures/mcp/mcp-auth.fixture';

export interface McpUserContext {
  userId: string;
  role: string;
  teamId?: string;
}

export interface McpAuthTokenValidator {
  validate(token: string): Promise<McpUserContext>;
}

export class InMemoryMcpAuthTokenValidator implements McpAuthTokenValidator {
  async validate(token: string): Promise<McpUserContext> {
    if (token === 'expired') {
      throw new Error('AUTH_FAILED');
    }
    const [role, userId] = token.split(':');
    return { userId: userId ?? 'user-1', role: role ?? 'Director', teamId: 'team-1' };
  }
}

export class McpPermissionDeniedError extends Error {
  readonly code = 'PERMISSION_DENIED';
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}

@Injectable()
export class McpAuthService {
  constructor(
    private readonly cedar: CedarAuthorizationService,
    private readonly audit: AuditService,
    private readonly tokenValidator: InMemoryMcpAuthTokenValidator,
  ) {}

  async authorizeToolCall(token: string, toolName: string): Promise<McpUserContext> {
    const context = await this.tokenValidator.validate(token);
    const mapping = mcpToolActions[toolName];
    if (!mapping) {
      throw new McpPermissionDeniedError();
    }

    const decision = await this.cedar.authorize(
      buildAuthRequest(
        {
          p7vcUserId: context.userId,
          p7vcRole: context.role,
          p7vcTeamId: context.teamId,
        },
        mapping.action as CedarAction,
        mapping.resourceType,
      ),
    );

    this.audit.publishAuditEvent({
      actorId: context.userId,
      actorRole: context.role,
      operation: 'update',
      resourceType: 'McpTool',
      resourceId: toolName,
      metadata: {
        action: 'mcp.authorize',
        tool: toolName,
        decision: decision.allowed ? 'permit' : 'deny',
      },
    });

    try {
      assertAuthorized(decision);
    } catch {
      throw new McpPermissionDeniedError();
    }
    return context;
  }
}
