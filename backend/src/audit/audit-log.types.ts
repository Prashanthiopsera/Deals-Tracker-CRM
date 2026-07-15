export type DomainAuditOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'reassign'
  | 'stage_transition'
  | 'ownership_reassignment'
  | 'ai_retrieval';

export interface DomainAuditEvent {
  eventId: string;
  actorId: string;
  actorRole: string;
  operation: DomainAuditOperation;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  affectedFields?: string[];
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEventQuery {
  actorId?: string;
  operation?: DomainAuditOperation;
  resourceType?: string;
  resourceId?: string;
  from?: Date;
  to?: Date;
}
