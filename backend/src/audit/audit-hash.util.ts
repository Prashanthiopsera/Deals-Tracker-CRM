import { createHash } from 'crypto';

export function computeAuditTamperHash(input: {
  actorId: string;
  operation: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  timestamp: string;
}): string {
  const payload = [
    input.actorId,
    input.operation,
    input.resourceId,
    JSON.stringify(input.beforeState ?? null),
    JSON.stringify(input.afterState ?? null),
    input.timestamp,
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}
