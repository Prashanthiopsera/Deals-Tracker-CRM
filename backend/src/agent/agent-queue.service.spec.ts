import { AgentQueueService, buildAgentQueueConfig } from './agent-queue.service';

describe('AgentQueueService (WO-089)', () => {
  it('moves messages to DLQ after maxReceiveCount', () => {
    const queue = new AgentQueueService();
    const message = { taskId: 'task-1', agentType: 'enrichment' };
    queue.publish(message);
    queue.markFailed(message);
    queue.markFailed(message);
    queue.markFailed(message);
    expect(queue.dlq).toHaveLength(1);
    expect(buildAgentQueueConfig().maxReceiveCount).toBe(3);
  });
});
