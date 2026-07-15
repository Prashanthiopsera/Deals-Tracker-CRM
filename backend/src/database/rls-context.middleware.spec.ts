import { buildRlsSessionStatements } from './rls-context.middleware';

describe('RlsContextMiddleware helpers', () => {
  it('builds postgres session variable statements for each role', () => {
    const statements = buildRlsSessionStatements('Director', 'user-123');
    expect(statements[0]).toContain('Director');
    expect(statements[1]).toContain('user-123');
  });
});
