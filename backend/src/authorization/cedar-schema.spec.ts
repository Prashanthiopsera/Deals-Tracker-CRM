import { readFileSync } from 'fs';
import { join } from 'path';

describe('Cedar schema', () => {
  const schemaPath = join(__dirname, '../../../policies/cedar/schema.cedar');
  const schema = readFileSync(schemaPath, 'utf8');

  it('defines all required entity types', () => {
    for (const entity of ['User', 'Company', 'Contact', 'Activity', 'Document', 'AuditLog']) {
      expect(schema).toContain(`entity ${entity}`);
    }
  });

  it('defines all required actions', () => {
    for (const action of [
      'create',
      'read',
      'update',
      'delete',
      'reassign',
      'update_ownership_fields',
    ]) {
      expect(schema).toContain(`action ${action}`);
    }
  });

  it('includes ownership and pii attributes', () => {
    expect(schema).toContain('p7vcDealLead');
    expect(schema).toContain('piiClassification');
    expect(schema).toContain('update_ownership_fields');
  });
});
