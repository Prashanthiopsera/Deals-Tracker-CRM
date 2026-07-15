import { AgentTask } from '../../src/agent/agent.types';

export const agentTaskFixtures: AgentTask[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    agent_type: 'enrichment',
    status: 'proposed',
    payload: { company_id: '11111111-1111-1111-1111-111111111111' },
    proposed_changes: { sector: 'AI' },
    acting_user_id: 'director-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    audit_trail_id: 'audit-1',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    agent_type: 'deal_memo',
    status: 'pending_approval',
    payload: { company_id: '11111111-1111-1111-1111-111111111111' },
    proposed_changes: { memo: 'Draft memo' },
    acting_user_id: 'associate-1',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    audit_trail_id: 'audit-2',
  },
];
