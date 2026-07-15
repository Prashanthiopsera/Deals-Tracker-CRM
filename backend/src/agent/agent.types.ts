export type AgentType = 'enrichment' | 'deal_memo' | 'follow_up' | 'pipeline_monitor';

export type AgentTaskStatus =
  | 'proposed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'failed';

export interface AgentTask {
  id: string;
  agent_type: AgentType;
  status: AgentTaskStatus;
  payload: Record<string, unknown>;
  proposed_changes: Record<string, unknown>;
  acting_user_id: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  audit_trail_id: string;
}

export interface AgentTaskTransition {
  from: AgentTaskStatus;
  to: AgentTaskStatus;
  at: string;
  actor_id: string;
  reason?: string;
}
