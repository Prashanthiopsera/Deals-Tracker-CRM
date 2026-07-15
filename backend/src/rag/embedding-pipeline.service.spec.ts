import { EmbeddingPipelineService, InMemoryBedrockEmbeddingClient, InMemoryEmbeddingQueueConsumer } from './embedding-pipeline.service';
import { EmbeddingsRegistryService } from './embeddings-registry.service';
import { mockEmbeddingQueueEvent } from '../../test-fixtures/rag/embedding-pipeline.fixture';

describe('EmbeddingPipelineService (WO-079)', () => {
  const registry = new EmbeddingsRegistryService();
  const bedrock = new InMemoryBedrockEmbeddingClient();
  const queue = new InMemoryEmbeddingQueueConsumer();
  const service = new EmbeddingPipelineService(registry, bedrock, queue);

  beforeEach(() => {
    bedrock.calls.length = 0;
    bedrock.dlq.length = 0;
    queue.events.length = 0;
    registry.seed([]);
  });

  it('chunks text with overlap at token boundaries', () => {
    const chunks = service.chunkText({
      notes: 'one two three four five six seven eight nine ten eleven twelve',
    }, 4, 2);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].tokenCount).toBeLessThanOrEqual(4);
  });

  it('generates embeddings via Bedrock client and upserts records', async () => {
    const result = await service.upsertCompanyEmbeddings(
      'company-1',
      { notes: 'Robotics startup with enterprise traction', sourceDocuments: 'Memo', version: 1 },
      ['notes'],
    );
    expect(result.upserted).toBeGreaterThan(0);
    expect(bedrock.calls.length).toBeGreaterThan(0);
    expect(queue.events[0]).toMatchObject({ eventType: 'embedding.upserted' });
  });

  it('re-embeds only changed fields on update', async () => {
    await service.upsertCompanyEmbeddings(
      'company-1',
      { notes: 'First version', sourceDocuments: 'Doc A', version: 1 },
      ['notes'],
    );
    const firstCallCount = bedrock.calls.length;
    await service.upsertCompanyEmbeddings(
      'company-1',
      { notes: 'Second version', sourceDocuments: 'Doc A', version: 2 },
      ['notes'],
    );
    expect(bedrock.calls.length).toBeGreaterThan(firstCallCount);
  });

  it('routes failed embedding events to DLQ', async () => {
    await expect(
      service.upsertCompanyEmbeddings(
        'company-1',
        { notes: '__FAIL__ trigger', sourceDocuments: 'Doc', version: 1 },
        ['notes'],
      ),
    ).rejects.toThrow('Bedrock embedding failed');
    expect(bedrock.dlq.length).toBe(1);
  });

  it('processes SQS-style queue events end-to-end', async () => {
    await service.processQueueEvent({
      ...mockEmbeddingQueueEvent,
      notes: 'Updated notes for embedding',
      sourceDocuments: 'Updated docs',
    });
    expect(registry.listForRole('Director').some((row) => row.companyId === 'company-1')).toBe(true);
  });
});
