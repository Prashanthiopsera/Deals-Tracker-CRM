import { AgentObservabilityService } from './agent-observability.service';

describe('AgentObservabilityService (WO-094)', () => {
  it('records structured transition logs and metrics', () => {
    const service = new AgentObservabilityService();
    service.recordTransition({
      task_id: 'task-1',
      agent_type: 'enrichment',
      status: 'pending_approval',
      acting_user_id: 'director-1',
      timestamp: new Date().toISOString(),
      duration_ms: 12,
    });
    expect(service.logs[0].agent_type).toBe('enrichment');
    expect(service.metrics.some((m) => m.metric === 'agent.task.transition')).toBe(true);
  });
});
