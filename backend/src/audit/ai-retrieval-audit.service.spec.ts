import { AiRetrievalAuditService } from './ai-retrieval-audit.service';
import { AuditLogConsumer } from './audit-log.consumer';
import { InMemoryAuditLogRepository } from './audit-log.repository';
import { AuditService } from './audit.service';
import { InMemoryAuditQueuePublisher } from './authorization-audit.publisher';

describe('AiRetrievalAuditService (WO-052)', () => {
  const queue = new InMemoryAuditQueuePublisher();
  const repository = new InMemoryAuditLogRepository();
  const audit = new AuditService(queue, new AuditLogConsumer(repository), repository);
  const service = new AiRetrievalAuditService(audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    repository.entries.length = 0;
  });

  it('publishes structured AI retrieval audit metadata', async () => {
    service.publishRetrieval({
      actorId: '11111111-1111-1111-1111-111111111111',
      actorRole: 'Director',
      resourceType: 'Company',
      resourceId: '22222222-2222-2222-2222-222222222222',
      prompt: 'Summarize the deck',
      response: 'Summary text',
      retrievedChunkIds: ['chunk-1', 'chunk-2'],
      modelId: 'gpt-test',
      piiRedactedFields: ['email'],
      retrievalLatencyMs: 20,
      inferenceLatencyMs: 30,
      rlsContext: { role: 'Director', filters: { deal_stage: 'screening' } },
    });

    expect(queue.domainMessages[0].operation).toBe('ai_retrieval');
    expect(queue.domainMessages[0].metadata).toMatchObject({
      retrieved_chunk_count: 2,
      model_id: 'gpt-test',
      rls_context: { role: 'Director' },
    });
  });
});
