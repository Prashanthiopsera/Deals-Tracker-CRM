import {
  AuthorizationAuditConsumer,
  AuthorizationAuditService,
} from './authorization-audit.service';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';
import { InMemoryAuthorizationMetrics } from './authorization-audit.metrics';
import { buildAuthRequest } from '../authorization/cedar.service';
import { VerifiedPermissionsClient } from '../authorization/cedar.service';

describe('AuthorizationAuditService', () => {
  const publisher = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const consumer = new AuthorizationAuditConsumer(repository);
  const metrics = new InMemoryAuthorizationMetrics();
  const service = new AuthorizationAuditService(publisher, consumer, metrics);
  const client = new VerifiedPermissionsClient();

  beforeEach(() => {
    publisher.messages.length = 0;
    repository.entries.length = 0;
    metrics.decisions.length = 0;
    process.env.CEDAR_BYPASS = 'false';
  });

  it('builds structured audit events for allow decisions', () => {
    const request = buildAuthRequest(
      { p7vcUserId: 'user-1', p7vcRole: 'Director' },
      'read',
      'Company',
      'c1',
    );
    const event = service.buildEvent(request, {
      allowed: true,
      policyId: 'director-full',
      cached: false,
      latencyMs: 1,
    });
    expect(event.decision).toBe('allow');
    expect(event.actorRole).toBe('Director');
    expect(event.resourceType).toBe('Company');
  });

  it('publishes deny events asynchronously to the audit queue', async () => {
    const request = buildAuthRequest(
      { p7vcUserId: 'user-2', p7vcRole: 'Intern' },
      'delete',
      'Company',
    );
    const decision = await client.isAuthorized(request);
    service.publishDecisionAsync(request, decision);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(publisher.messages).toHaveLength(1);
    expect(publisher.messages[0].decision).toBe('deny');
  });

  it('persists queued events to audit_logs metadata shape', async () => {
    const request = buildAuthRequest(
      { p7vcUserId: 'user-3', p7vcRole: 'Associate' },
      'read',
      'Contact',
    );
    const event = service.buildEvent(
      request,
      { allowed: true, policyId: 'associate-read', cached: false, latencyMs: 1 },
      'api',
      { path: '/api/contacts' },
    );
    await service.processQueuedEvent(event);
    expect(repository.entries).toHaveLength(1);
    expect(repository.entries[0].actorRole).toBe('Associate');
    expect(repository.entries[0].metadata).toMatchObject({
      cedar_policy_id: 'associate-read',
      source: 'api',
    });
    expect(repository.entries[0].entityType).toBe('Contact');
  });

  it('records CloudWatch metric dimensions in memory publisher', async () => {
    const request = buildAuthRequest(
      { p7vcUserId: 'user-4', p7vcRole: 'Principal' },
      'update',
      'Company',
    );
    const event = service.buildEvent(request, {
      allowed: true,
      policyId: 'principal-update',
      cached: false,
      latencyMs: 1,
    });
    await metrics.recordDecision(event);
    expect(metrics.decisions[0].action).toBe('update');
  });
});
