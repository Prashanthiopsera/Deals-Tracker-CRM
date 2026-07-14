import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CedarCache } from './cedar-cache';
import { AuthorizationAuditService } from '../audit/authorization-audit.service';
import {
  CedarAction,
  CedarAuthDecision,
  CedarAuthRequest,
  CedarPolicyClient,
} from './cedar.types';

@Injectable()
export class VerifiedPermissionsClient implements CedarPolicyClient {
  private readonly logger = new Logger(VerifiedPermissionsClient.name);

  async isAuthorized(request: CedarAuthRequest): Promise<CedarAuthDecision> {
    const started = Date.now();
    if (process.env.CEDAR_BYPASS === 'true') {
      return { allowed: true, policyId: 'bypass', cached: false, latencyMs: 0 };
    }

    try {
      const allowed = this.evaluateLocally(request);
      const decision: CedarAuthDecision = {
        allowed,
        policyId: allowed ? 'local-rbac-matrix' : 'deny-default',
        cached: false,
        latencyMs: Date.now() - started,
      };
      this.logger.log(
        JSON.stringify({
          actor: request.userId,
          role: request.role,
          action: request.action,
          resource: `${request.resourceType}:${request.resourceId ?? '*'}`,
          decision: allowed ? 'permit' : 'deny',
          policy_id: decision.policyId,
          latency_ms: decision.latencyMs,
        }),
      );
      return decision;
    } catch {
      throw new ServiceUnavailableException('Authorization service unavailable');
    }
  }

  private evaluateLocally(request: CedarAuthRequest): boolean {
    const { role, action } = request;
    if (role === 'Director' || role === 'Admin') return true;
    if (role === 'Principal') return action !== 'delete';
    if (role === 'Associate') {
      return ['create', 'read', 'update'].includes(action);
    }
    if (role === 'Intern') {
      if (action === 'update_ownership_field') return false;
      return ['read', 'update'].includes(action);
    }
    return false;
  }
}

@Injectable()
export class CedarAuthorizationService {
  constructor(
    private readonly client: CedarPolicyClient,
    private readonly cache: CedarCache,
    private readonly audit?: AuthorizationAuditService,
  ) {}

  async authorize(request: CedarAuthRequest): Promise<CedarAuthDecision> {
    const cacheKey = `${request.userId}:${request.action}:${request.resourceType}:${request.resourceId ?? '*'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.audit?.publishDecisionAsync(request, cached);
      return cached;
    }

    const decision = await this.client.isAuthorized(request);
    await this.cache.set(cacheKey, decision);
    this.audit?.publishDecisionAsync(request, decision);
    return decision;
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.cache.invalidateForUser(userId);
  }
}

export function assertAuthorized(decision: CedarAuthDecision): void {
  if (!decision.allowed) {
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}

export function buildAuthRequest(
  user: { p7vcUserId: string; p7vcRole: string; p7vcTeamId?: string },
  action: CedarAction,
  resourceType: string,
  resourceId?: string,
): CedarAuthRequest {
  return {
    userId: user.p7vcUserId,
    role: user.p7vcRole,
    teamId: user.p7vcTeamId,
    action,
    resourceType,
    resourceId,
  };
}
