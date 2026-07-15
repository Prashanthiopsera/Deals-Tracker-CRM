export type AuthorizationDecision = 'allow' | 'deny';
export type AuthorizationSource = 'api' | 'mcp' | 'agent';

export interface AuthorizationAuditEvent {
  eventId: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  decision: AuthorizationDecision;
  cedarPolicyId?: string;
  source: AuthorizationSource;
  timestamp: string;
  requestMetadata?: Record<string, unknown>;
}
