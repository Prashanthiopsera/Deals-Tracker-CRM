import { readFileSync } from 'fs';
import { join } from 'path';

describe('ai audit logs migration (WO-082)', () => {
  const source = readFileSync(
    join(__dirname, 'migrations/1730000000016-AiAuditLogs.ts'),
    'utf8',
  );

  it('creates immutable ai_audit_logs table', () => {
    expect(source).toContain('ai_audit_logs');
    expect(source).toContain('retrieved_chunk_ids JSONB');
    expect(source).toContain('REVOKE UPDATE, DELETE');
  });
});
