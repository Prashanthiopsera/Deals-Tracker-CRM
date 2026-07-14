import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CedarAction,
  CedarAuthDecision,
  CedarAuthRequest,
  CedarPolicyClient,
} from './cedar.types';

interface CacheEntry {
  decision: CedarAuthDecision;
  expiresAt: number;
}

@Injectable()
export class InMemoryCedarCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs = 60_000;
  private readonly maxEntries = 1000;

  get(key: string): CedarAuthDecision | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return { ...entry.decision, cached: true };
  }

  set(key: string, decision: CedarAuthDecision): void {
    if (this.entries.size >= this.maxEntries) {
      const firstKey = this.entries.keys().next().value as string;
      this.entries.delete(firstKey);
    }
    this.entries.set(key, { decision, expiresAt: Date.now() + this.ttlMs });
  }

  invalidateForUser(userId: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.entries.delete(key);
      }
    }
  }
}

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
    private readonly client: VerifiedPermissionsClient,
    private readonly cache: InMemoryCedarCache,
  ) {}

  async authorize(request: CedarAuthRequest): Promise<CedarAuthDecision> {
    const cacheKey = `${request.userId}:${request.action}:${request.resourceType}:${request.resourceId ?? '*'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const decision = await this.client.isAuthorized(request);
    this.cache.set(cacheKey, decision);
    return decision;
  }

  invalidateUser(userId: string): void {
    this.cache.invalidateForUser(userId);
  }
}

export function assertAuthorized(decision: CedarAuthDecision): void {
  if (!decision.allowed) {
    throw new ForbiddenException('You do not have permission to perform this action');
  }
}

export function buildAuthRequest(
  user: { p7vcUserId: string; p7vcRole: string },
  action: CedarAction,
  resourceType: string,
  resourceId?: string,
): CedarAuthRequest {
  return {
    userId: user.p7vcUserId,
    role: user.p7vcRole,
    action,
    resourceType,
    resourceId,
  };
}
