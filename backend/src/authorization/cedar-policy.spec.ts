import { readFileSync } from 'fs';
import { join } from 'path';
import { VerifiedPermissionsClient } from './cedar.service';
import { CedarAction } from './cedar.types';

interface Scenario {
  role: string;
  action: string;
  resource: string;
  expected: 'allow' | 'deny';
}

const scenarios = JSON.parse(
  readFileSync(join(__dirname, '../../test-fixtures/cedar/authorization-scenarios.json'), 'utf8'),
) as Scenario[];

describe('Cedar RBAC policy scenarios', () => {
  const client = new VerifiedPermissionsClient();

  it.each(scenarios)(
    '$role $action on $resource => $expected',
    async ({ role, action, expected }) => {
      process.env.CEDAR_BYPASS = 'false';
      const decision = await client.isAuthorized({
        userId: `${role.toLowerCase()}-1`,
        role,
        action: action as CedarAction,
        resourceType: 'Company',
      });
      expect(decision.allowed).toBe(expected === 'allow');
    },
  );
});
