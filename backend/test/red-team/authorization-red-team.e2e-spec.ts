import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CedarAuthorizationService, buildAuthRequest } from '../../src/authorization/cedar.service';
import { stripMcpOwnershipFields } from '../../src/companies/mcp-ownership';
import { CompaniesService } from '../../src/companies/companies.service';
import { toCompanyResponse } from '../../src/companies/ownership-fields';

interface RedTeamScenario {
  id: string;
  role: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  expectedStatus: number;
  assertNoOwnershipFields?: boolean;
  assertHasOwnershipFields?: boolean;
  resetAfter?: boolean;
}

interface RedTeamFixture {
  companyId: string;
  users: Record<string, string>;
  scenarios: RedTeamScenario[];
}

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../test-fixtures/red-team/scenarios.json'), 'utf8'),
) as RedTeamFixture;

const ROLES = ['Director', 'Principal', 'Associate', 'Intern'] as const;
const ACTIONS = ['read', 'create', 'update', 'delete', 'reassign'] as const;

function expandPath(path: string): string {
  return path.replace('{{companyId}}', fixture.companyId);
}

function roleHeaders(role: string): Record<string, string> {
  return {
    'x-p7vc-test-role': role,
    'x-p7vc-test-user-id': fixture.users[role] ?? fixture.users.Director,
  };
}

function generatedMatrixScenarios(): RedTeamScenario[] {
  const generated: RedTeamScenario[] = [];
  for (const role of ROLES) {
    for (const action of ACTIONS) {
      generated.push({
        id: `matrix-${role.toLowerCase()}-${action}-company`,
        role,
        method:
          action === 'read'
            ? 'GET'
            : action === 'create'
              ? 'POST'
              : action === 'delete'
                ? 'DELETE'
                : 'PATCH',
        path:
          action === 'create'
            ? '/api/companies'
            : action === 'reassign'
              ? `/api/companies/${fixture.companyId}/owner`
              : `/api/companies/${fixture.companyId}`,
        body:
          action === 'create'
            ? { name: `Matrix ${role}` }
            : action === 'update'
              ? { notes: `matrix-${role}` }
              : action === 'reassign'
                ? { deal_lead_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }
                : undefined,
        expectedStatus:
          role === 'Director'
            ? action === 'create'
              ? 201
              : 200
            : role === 'Intern' && ['create', 'delete', 'reassign'].includes(action)
              ? 403
              : role === 'Associate' && ['delete', 'reassign'].includes(action)
                ? 403
                : role === 'Principal' && action === 'delete'
                  ? 403
                  : action === 'create'
                    ? 201
                    : 200,
      });
    }
  }
  return generated;
}

describe('Authorization red-team suite (WO-029)', () => {
  let app: INestApplication;
  const allScenarios = [...fixture.scenarios, ...generatedMatrixScenarios()];

  beforeAll(async () => {
    process.env.AUTH_BYPASS = 'true';
    process.env.CEDAR_BYPASS = 'false';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    app.get(CompaniesService).resetToSeed();
  });

  it('contains at least 50 authorization scenarios', () => {
    expect(allScenarios.length).toBeGreaterThanOrEqual(50);
  });

  it.each(allScenarios)('$id => $role $method $path expects $expectedStatus', async (scenario) => {
    const path = expandPath(scenario.path);
    const agent = request(app.getHttpServer())[scenario.method.toLowerCase() as 'get'](path);
    agent.set(roleHeaders(scenario.role));
    if (scenario.body) {
      agent.send(scenario.body);
    }
    const response = await agent;
    expect(response.status).toBe(scenario.expectedStatus);

    if (scenario.assertNoOwnershipFields && response.status === 200) {
      const payload = Array.isArray(response.body) ? response.body[0] : response.body;
      expect(payload).not.toHaveProperty('deal_lead_id');
      expect(payload).not.toHaveProperty('support1_id');
      expect(payload).not.toHaveProperty('support2_id');
    }
    if (scenario.assertHasOwnershipFields && response.status === 200) {
      expect(response.body).toHaveProperty('deal_lead_id');
    }
    if (scenario.resetAfter) {
      app.get(CompaniesService).resetToSeed();
    }
  });

  it('handles concurrent requests from different roles independently', async () => {
    const server = app.getHttpServer();
    const [directorRes, internRes] = await Promise.all([
      request(server)
        .get(`/api/companies/${fixture.companyId}`)
        .set(roleHeaders('Director')),
      request(server)
        .get(`/api/companies/${fixture.companyId}`)
        .set(roleHeaders('Intern')),
    ]);
    expect(directorRes.status).toBe(200);
    expect(directorRes.body.deal_lead_id).toBeDefined();
    expect(internRes.status).toBe(200);
    expect(internRes.body.deal_lead_id).toBeUndefined();
  });

  it.each(ROLES)('MCP simulation for %s matches API ownership visibility rules', async (role) => {
    const company = {
      id: fixture.companyId,
      name: 'MCP Co',
      p7vc_deal_lead: '22222222-2222-2222-2222-222222222222',
      deal_lead_support_1: '33333333-3333-3333-3333-333333333333',
      deal_lead_support_2: '44444444-4444-4444-4444-444444444444',
      notes: 'mcp',
      status: 'Active',
    };
    const mcpPayload = stripMcpOwnershipFields(role, toCompanyResponse(company));
    if (role === 'Intern') {
      expect(mcpPayload.deal_lead_id).toBeUndefined();
    } else {
      expect(mcpPayload.deal_lead_id).toBeDefined();
    }

    const cedar = app.get(CedarAuthorizationService);
    const decision = await cedar.authorize(
      buildAuthRequest(
        { p7vcUserId: fixture.users[role], p7vcRole: role },
        'read',
        'Company',
        fixture.companyId,
      ),
    );
    expect(decision.allowed).toBe(true);
  });
});
