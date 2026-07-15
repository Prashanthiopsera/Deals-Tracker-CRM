import { createAuditTestStack } from '../audit/audit-test.utils';
import { UserRole } from '../database/enums';
import { EmbeddingsRegistryService } from './embeddings-registry.service';
import { InMemoryBedrockEmbeddingClient } from './embedding-pipeline.service';
import { RetrievalService } from './retrieval.service';
import { embeddingSeedRecords } from '../../test-fixtures/rag/embedding-seeds.fixture';

describe('RetrievalService (WO-080)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const registry = new EmbeddingsRegistryService();
  const bedrock = new InMemoryBedrockEmbeddingClient();
  const service = new RetrievalService(registry, bedrock, audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    registry.seed(embeddingSeedRecords);
  });

  it('returns top-K similarity results with company metadata', async () => {
    const response = await service.retrieve('robotics diligence', 'director-1', UserRole.DIRECTOR, 5);
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0]).toMatchObject({
      chunkText: expect.any(String),
      companyId: expect.any(String),
      similarityScore: expect.any(Number),
    });
  });

  it('filters results by RLS role context', async () => {
    const director = await service.retrieve('robotics', 'director-1', UserRole.DIRECTOR, 10);
    const intern = await service.retrieve('robotics', 'intern-1', UserRole.INTERN, 10);
    expect(director.total).toBeGreaterThanOrEqual(intern.total);
  });

  it('returns empty results without error when nothing matches', async () => {
    registry.seed([]);
    const response = await service.retrieve('zzznomatch', 'director-1', UserRole.DIRECTOR);
    expect(response.total).toBe(0);
  });

  it('logs retrieval calls to audit trail', async () => {
    await service.retrieve('robotics', 'director-1', UserRole.DIRECTOR);
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'rag.retrieve')).toBe(true);
  });

  it('completes retrieval under 1 second for fixture dataset', async () => {
    const response = await service.retrieve('robotics', 'director-1', UserRole.DIRECTOR);
    expect(response.latencyMs).toBeLessThan(1000);
  });
});
