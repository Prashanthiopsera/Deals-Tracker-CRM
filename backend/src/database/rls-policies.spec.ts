import { readFileSync } from 'fs';
import { join } from 'path';
import { buildRlsSessionStatements } from './rls-context.middleware';
import { ExpandCrmRls1730000000002 } from './migrations/1730000000002-ExpandCrmRls';
import { ForceCompaniesRls1730000000011 } from './migrations/1730000000011-ForceCompaniesRls';

describe('RLS policies', () => {
  const migrationSource = readFileSync(
    join(__dirname, 'migrations/1730000000002-ExpandCrmRls.ts'),
    'utf8',
  );

  it('enables RLS on all CRM tables', () => {
    expect(migrationSource).toContain("_universal_read ON ${table}");
    expect(migrationSource).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migrationSource).toContain('audit_logs_read');
  });

  it('defines universal read policy for companies', () => {
    expect(migrationSource).toContain('companies_universal_read');
    expect(migrationSource).toContain('app_is_authenticated()');
  });

  it('restricts company insert to create roles', () => {
    expect(migrationSource).toContain('companies_create_roles');
    expect(migrationSource).toContain("IN ('Director', 'Principal', 'Associate', 'Admin')");
  });

  it('restricts company delete to director', () => {
    expect(migrationSource).toContain('companies_director_delete');
    expect(migrationSource).toContain("IN ('Director', 'Admin')");
  });

  it('masks intern ownership via view', () => {
    expect(migrationSource).toContain('companies_intern_masked');
    expect(migrationSource).toContain("= 'Intern' THEN NULL ELSE p7vc_deal_lead");
  });

  it('builds session statements for every role', () => {
    for (const role of ['Director', 'Principal', 'Associate', 'Intern']) {
      const statements = buildRlsSessionStatements(role, 'user-1');
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain(role);
    }
  });

  it('migration class is registered', () => {
    expect(new ExpandCrmRls1730000000002().name).toBe('ExpandCrmRls1730000000002');
    expect(new ForceCompaniesRls1730000000011().name).toBe('ForceCompaniesRls1730000000011');
  });

  it('forces row level security on companies table', () => {
    const forceRlsSource = readFileSync(
      join(__dirname, 'migrations/1730000000011-ForceCompaniesRls.ts'),
      'utf8',
    );
    expect(forceRlsSource).toContain('FORCE ROW LEVEL SECURITY');
  });
});
