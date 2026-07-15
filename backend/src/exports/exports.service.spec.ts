import { createAuditTestStack } from '../audit/audit-test.utils';
import { ExportsService } from './exports.service';

describe('ExportsService (WO-117)', () => {
  const { service: audit } = createAuditTestStack();
  const exportsService = new ExportsService(audit);

  it('creates csv export for director', () => {
    const result = exportsService.createExport({
      actorId: 'director-1',
      role: 'Director',
      format: 'csv',
      filters: {},
    });
    expect(result.status).toBe('ready');
  });

  it('blocks intern exports', () => {
    expect(() =>
      exportsService.createExport({
        actorId: 'intern-1',
        role: 'Intern',
        format: 'csv',
        filters: {},
      }),
    ).toThrow('Forbidden');
  });
});
