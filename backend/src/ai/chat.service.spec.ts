import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { createAuditTestStack } from '../audit/audit-test.utils';
import { AiRetrievalAuditService } from '../audit/ai-retrieval-audit.service';
import { PiiRegistryService } from '../pii/pii-registry.service';
import { PiiRedactionService } from './pii-redaction.service';
import { EmbeddingsRegistryService } from '../rag/embeddings-registry.service';
import { InMemoryBedrockEmbeddingClient } from '../rag/embedding-pipeline.service';
import { RetrievalService } from '../rag/retrieval.service';
import { ChatService, InMemoryClaudeClient, mockChatPrompts } from './chat.service';
import { UserRole } from '../database/enums';
import { embeddingSeedRecords } from '../../test-fixtures/rag/embedding-seeds.fixture';
import { REDACTED_VALUE } from './pii-redaction.service';

describe('ChatService (WO-081)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const redaction = new PiiRedactionService(piiRegistry, audit);
  const aiAudit = new AiRetrievalAuditService(audit);
  const registry = new EmbeddingsRegistryService();
  const bedrock = new InMemoryBedrockEmbeddingClient();
  const retrieval = new RetrievalService(registry, bedrock, audit);
  const claude = new InMemoryClaudeClient();
  const service = new ChatService(retrieval, redaction, claude, audit, aiAudit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    piiRegistry.onModuleInit();
    registry.seed(embeddingSeedRecords);
    claude.circuitOpen = false;
  });

  it('orchestrates retrieval, Claude invocation, and PII redaction', async () => {
    const response = await service.chat(mockChatPrompts.director, 'director-1', UserRole.DIRECTOR);
    expect(response.message).toContain('Nova AI');
    expect(response.retrievedChunks).toBeGreaterThan(0);
  });

  it('redacts confidential PII for intern responses', async () => {
    const response = await service.chat(mockChatPrompts.intern, 'intern-1', UserRole.INTERN);
    expect(response.message).toContain(REDACTED_VALUE);
  });

  it('returns graceful error when Bedrock is unavailable', async () => {
    claude.circuitOpen = true;
    await expect(
      service.chat(mockChatPrompts.director, 'director-1', UserRole.DIRECTOR),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('enforces rate limiting at 20 requests per minute', async () => {
    for (let i = 0; i < 20; i += 1) {
      await service.chat('test', 'user-rate', UserRole.DIRECTOR);
    }
    await expect(service.chat('test', 'user-rate', UserRole.DIRECTOR)).rejects.toThrow(
      HttpException,
    );
  });

  it('logs chat interactions to audit trail', async () => {
    await service.chat(mockChatPrompts.director, 'director-1', UserRole.DIRECTOR);
    expect(queue.domainMessages.some((event) => event.operation === 'ai_retrieval')).toBe(true);
  });
});
