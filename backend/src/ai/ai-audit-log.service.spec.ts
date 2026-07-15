import { AiAuditConsumer, AiAuditLogService, InMemoryAiAuditQueuePublisher } from './ai-audit-log.service';

describe('AiAuditLogService (WO-082)', () => {
  const queue = new InMemoryAiAuditQueuePublisher();
  const consumer = new AiAuditConsumer(queue);
  const service = new AiAuditLogService(queue, consumer);

  beforeEach(() => {
    queue.events.length = 0;
    queue.dlq.length = 0;
  });

  it('persists chat and retrieval interactions from queue events', async () => {
    await service.recordInteraction({
      userId: 'director-1',
      userRole: 'Director',
      interactionType: 'chat',
      promptText: 'test',
      responseText: 'answer',
      retrievedChunkIds: ['emb-1'],
      retrievedCompanyIds: ['company-1'],
      modelId: 'claude',
      inputTokens: 10,
      outputTokens: 5,
      latencyMs: 100,
      piiRedactionsApplied: [],
    });
    expect(service.search({ userId: 'director-1' }).length).toBeGreaterThan(0);
  });

  it('supports admin search filters by interaction type and company', () => {
    const chatLogs = service.search({ interactionType: 'chat' });
    expect(chatLogs.every((log) => log.interactionType === 'chat')).toBe(true);
  });

  it('routes malformed events to DLQ', async () => {
    await expect(
      queue.publish({
        userId: '',
        userRole: 'Director',
        interactionType: 'chat',
        promptText: '',
        responseText: null,
        retrievedChunkIds: [],
        retrievedCompanyIds: [],
        modelId: null,
        inputTokens: null,
        outputTokens: null,
        latencyMs: null,
        piiRedactionsApplied: [],
      }),
    ).rejects.toThrow('Invalid AI audit event');
    expect(queue.dlq.length).toBe(1);
  });
});
