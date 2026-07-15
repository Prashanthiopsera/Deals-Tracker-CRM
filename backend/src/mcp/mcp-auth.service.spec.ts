import { createAuditTestStack } from '../audit/audit-test.utils';
import { InMemoryCedarCache } from '../authorization/cedar-cache';
import { CedarAuthorizationService, VerifiedPermissionsClient } from '../authorization/cedar.service';
import {
  InMemoryMcpAuthTokenValidator,
  McpAuthService,
  McpPermissionDeniedError,
} from './mcp-auth.service';

describe('McpAuthService (WO-085)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const cedar = new CedarAuthorizationService(
    new VerifiedPermissionsClient(),
    new InMemoryCedarCache(),
  );
  const validator = new InMemoryMcpAuthTokenValidator();
  const service = new McpAuthService(cedar, audit, validator);

  beforeEach(() => {
    queue.domainMessages.length = 0;
  });

  it('authorizes director tool calls', async () => {
    const context = await service.authorizeToolCall('Director:director-1', 'search_companies');
    expect(context.role).toBe('Director');
  });

  it('denies intern create_record calls', async () => {
    await expect(
      service.authorizeToolCall('Intern:intern-1', 'create_record'),
    ).rejects.toThrow(McpPermissionDeniedError);
  });

  it('denies associate reassign_owner calls', async () => {
    await expect(
      service.authorizeToolCall('Associate:associate-1', 'reassign_owner'),
    ).rejects.toThrow(McpPermissionDeniedError);
  });

  it('returns AUTH_FAILED for expired tokens', async () => {
    await expect(service.authorizeToolCall('expired', 'search_companies')).rejects.toThrow(
      'AUTH_FAILED',
    );
  });

  it('audits every authorization decision', async () => {
    await service.authorizeToolCall('Director:director-1', 'get_record');
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'mcp.authorize')).toBe(
      true,
    );
  });
});
