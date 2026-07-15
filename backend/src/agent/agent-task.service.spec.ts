import { createAuditTestStack } from '../audit/audit-test.utils';
import { InMemoryCedarCache } from '../authorization/cedar-cache';
import { CedarAuthorizationService, VerifiedPermissionsClient } from '../authorization/cedar.service';
import { AgentQueueService } from './agent-queue.service';
import { AgentTaskService } from './agent-task.service';
import { agentTaskFixtures } from '../../test-fixtures/agent/agent-tasks.fixture';

describe('AgentTaskService (WO-089)', () => {
  const { queue: auditQueue, service: audit } = createAuditTestStack();
  const agentQueue = new AgentQueueService();
  const cedar = new CedarAuthorizationService(
    new VerifiedPermissionsClient(),
    new InMemoryCedarCache(),
  );
  const service = new AgentTaskService(agentQueue, cedar, audit);

  beforeEach(() => {
    auditQueue.domainMessages.length = 0;
    agentQueue.queue.length = 0;
  });

  it('creates tasks and publishes to AgentQueue', () => {
    const task = service.createTask({
      agent_type: 'enrichment',
      payload: { company_id: 'c1' },
      proposed_changes: { sector: 'Robotics' },
      acting_user_id: 'director-1',
    });
    expect(task.status).toBe('proposed');
    expect(agentQueue.queue).toHaveLength(1);
  });

  it('approves pending tasks after Cedar permit', async () => {
    service.seed(agentTaskFixtures[1]);
    const approved = await service.approve(
      agentTaskFixtures[1].id,
      'director-1',
      'Director',
    );
    expect(approved.status).toBe('executed');
  });

  it('rejects tasks when Cedar denies', async () => {
    const task = service.createTask({
      agent_type: 'enrichment',
      payload: {},
      proposed_changes: { sector: 'AI' },
      acting_user_id: 'intern-1',
    });
    service.submitForApproval(task.id, 'intern-1');
    const rejected = await service.approve(task.id, 'intern-1', 'Intern');
    expect(rejected.status).toBe('rejected');
  });

  it('records append-only status transitions', () => {
    const task = service.createTask({
      agent_type: 'follow_up',
      payload: {},
      proposed_changes: {},
      acting_user_id: 'director-1',
    });
    service.submitForApproval(task.id, 'director-1');
    const transitions = service.getTransitions(task.id);
    expect(transitions.some((t) => t.to === 'pending_approval')).toBe(true);
  });
});
