import { getMetadataArgsStorage } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditAction } from '../enums';

describe('AuditLog entity', () => {
  it('defines audit_action enum values', () => {
    expect(AuditAction.PERMISSION_DENIED).toBe('permission_denied');
    expect(AuditAction.AI_RETRIEVAL).toBe('ai_retrieval');
  });

  it('allows nullable before_state and after_state', () => {
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === AuditLog);
    const before = columns.find((c) => c.propertyName === 'beforeState');
    const after = columns.find((c) => c.propertyName === 'afterState');
    expect(before?.options.nullable).toBe(true);
    expect(after?.options.nullable).toBe(true);
  });

  it('stores actor_id without FK metadata', () => {
    const relations = getMetadataArgsStorage().relations.filter((r) => r.target === AuditLog);
    expect(relations).toHaveLength(0);
    const actor = getMetadataArgsStorage().columns.find(
      (c) => c.target === AuditLog && c.propertyName === 'actorId',
    );
    expect(actor).toBeDefined();
  });
});
