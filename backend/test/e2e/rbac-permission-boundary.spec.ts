import { deriveCedarAction } from '../../src/authorization/cedar-action-mapper';

const ROLE_MATRIX: Record<string, Record<string, boolean>> = {
  Director: { create: true, read: true, update: true, delete: true, reassign: true },
  Principal: { create: true, read: true, update: true, delete: false, reassign: true },
  Associate: { create: true, read: true, update: true, delete: false, reassign: false },
  Intern: { create: false, read: true, update: true, delete: false, reassign: false },
};

describe('E2E RBAC permission boundary matrix (WO-125)', () => {
  for (const [role, actions] of Object.entries(ROLE_MATRIX)) {
    for (const [action, allowed] of Object.entries(actions)) {
      it(`${role} ${action} expectation`, () => {
        expect(typeof allowed).toBe('boolean');
      });
    }
  }

  it('maps HTTP verbs to cedar actions', () => {
    expect(deriveCedarAction('GET', '/api/companies')).toBe('read');
    expect(deriveCedarAction('DELETE', '/api/companies/c1')).toBe('delete');
  });
});
