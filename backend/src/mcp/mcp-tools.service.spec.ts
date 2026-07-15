import { createAuditTestStack } from '../audit/audit-test.utils';
import { SqsCompanyAuditPublisher } from '../companies/companies.service';
import { CompaniesInMemoryService } from '../companies/companies-in-memory.service';
import { InMemoryCedarCache } from '../authorization/cedar-cache';
import { CedarAuthorizationService, VerifiedPermissionsClient } from '../authorization/cedar.service';
import { InMemoryMcpAuthTokenValidator, McpAuthService } from './mcp-auth.service';
import { McpObservabilityService, InMemoryMcpMetricPublisher, McpRateLimiter } from './mcp-observability.service';
import { McpToolExecutorService } from './mcp-tool-executor.service';
import { McpToolsService } from './mcp-tools.service';

describe('McpToolsService (WO-086)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const companyAudit = new SqsCompanyAuditPublisher(audit);
  const companies = new CompaniesInMemoryService(companyAudit);
  const tools = new McpToolsService(companies as unknown as import('../companies/companies.service').CompaniesService, audit);
  const cedar = new CedarAuthorizationService(
    new VerifiedPermissionsClient(),
    new InMemoryCedarCache(),
  );
  const auth = new McpAuthService(cedar, audit, new InMemoryMcpAuthTokenValidator());
  const observability = new McpObservabilityService(
    new InMemoryMcpMetricPublisher(),
    new McpRateLimiter(),
  );
  const executor = new McpToolExecutorService(auth, tools, observability);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    companies.resetToSeed();
  });

  it('search_companies returns filtered results for director', async () => {
    const result = await executor.execute('Director:director-1', 'search_companies', {
      query: 'Acme',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('get_record returns company by id', async () => {
    const result = await executor.execute('Director:director-1', 'get_record', {
      company_id: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: 'Acme Robotics' });
  });

  it('create_record succeeds for director', async () => {
    const result = await executor.execute('Director:director-1', 'create_record', {
      company_name: 'NewCo',
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: 'NewCo' });
  });

  it('denies intern create_record at auth layer', async () => {
    const result = await executor.execute('Intern:intern-1', 'create_record', {
      company_name: 'BlockedCo',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('denies intern ownership field updates', async () => {
    const result = await executor.execute('Intern:intern-1', 'update_fields', {
      company_id: '11111111-1111-1111-1111-111111111111',
      fields: { deal_lead: '99999999-9999-9999-9999-999999999999' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('denies associate reassign_owner', async () => {
    const result = await executor.execute('Associate:associate-1', 'reassign_owner', {
      company_id: '11111111-1111-1111-1111-111111111111',
      field_name: 'deal_lead',
      new_owner_id: '99999999-9999-9999-9999-999999999999',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('returns validation errors for missing fields', async () => {
    const result = await executor.execute('Director:director-1', 'create_record', {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('audits tool executions', async () => {
    await executor.execute('Director:director-1', 'get_record', {
      company_id: '11111111-1111-1111-1111-111111111111',
    });
    expect(queue.domainMessages.some((e) => e.metadata?.action === 'mcp.tool.execute')).toBe(true);
  });
});
