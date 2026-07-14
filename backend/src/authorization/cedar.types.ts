export type CedarAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'reassign'
  | 'update_ownership_field';

export interface CedarAuthRequest {
  userId: string;
  role: string;
  teamId?: string;
  action: CedarAction;
  resourceType: string;
  resourceId?: string;
}

export interface CedarAuthDecision {
  allowed: boolean;
  policyId?: string;
  cached: boolean;
  latencyMs: number;
}

export interface CedarPolicyClient {
  isAuthorized(request: CedarAuthRequest): Promise<CedarAuthDecision>;
}
