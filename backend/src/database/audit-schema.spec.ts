import { readFileSync } from 'fs';
import { join } from 'path';
import { ImmutableAuditLogs1730000000007 } from './migrations/1730000000007-ImmutableAuditLogs';
import { AuditLogActorRole1730000000008 } from './migrations/1730000000008-AuditLogActorRole';

describe('audit_logs schema (WO-050)', () => {
  const migrationSource = readFileSync(
    join(__dirname, 'migrations/1730000000007-ImmutableAuditLogs.ts'),
    'utf8',
  );

  it('creates partitioned append-only audit_logs table', () => {
    expect(migrationSource).toContain('CREATE TABLE audit_logs');
    expect(migrationSource).toContain('PARTITION BY RANGE (timestamp)');
    expect(migrationSource).toContain('prevent_audit_modification');
    expect(migrationSource).toContain('REVOKE UPDATE, DELETE ON audit_logs');
    expect(migrationSource).toContain('GRANT SELECT, INSERT ON audit_logs');
  });

  it('indexes actor, entity, and timestamp columns', () => {
    expect(migrationSource).toContain('idx_audit_logs_actor_id');
    expect(migrationSource).toContain('idx_audit_logs_entity_type');
    expect(migrationSource).toContain('idx_audit_logs_timestamp');
  });

  it('registers immutable audit migrations', () => {
    expect(new ImmutableAuditLogs1730000000007().name).toBe('ImmutableAuditLogs1730000000007');
    expect(new AuditLogActorRole1730000000008().name).toBe('AuditLogActorRole1730000000008');
  });
});
