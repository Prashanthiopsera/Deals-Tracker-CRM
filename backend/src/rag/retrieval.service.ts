import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { buildRlsSessionStatements } from '../database/rls-context.middleware';
import { UserRole } from '../database/enums';
import { cosineSimilarity } from '../../test-fixtures/search/semantic-search.fixture';
import { EmbeddingsRegistryService } from './embeddings-registry.service';
import { InMemoryBedrockEmbeddingClient } from './embedding-pipeline.service';

export interface RetrievalResult {
  chunkText: string;
  similarityScore: number;
  companyId: string;
  companyName: string;
  sourceField: string;
  chunkIndex: number;
}

export interface RetrievalResponse {
  query: string;
  results: RetrievalResult[];
  total: number;
  latencyMs: number;
  rlsContext: { role: string; userId: string };
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly registry: EmbeddingsRegistryService,
    private readonly bedrock: InMemoryBedrockEmbeddingClient,
    private readonly audit: AuditService,
  ) {}

  async retrieve(
    query: string,
    userId: string,
    role: string,
    topK = 10,
  ): Promise<RetrievalResponse> {
    const started = performance.now();
    const sessionStatements = buildRlsSessionStatements(role, userId);
    const queryEmbedding = await this.bedrock.embedText(query);
    const candidates = this.registry.listForRole(role);

    const results = candidates
      .map((record) => ({
        chunkText: record.chunkText,
        similarityScore: cosineSimilarity(queryEmbedding, record.embedding),
        companyId: record.companyId,
        companyName: record.companyName,
        sourceField: String(record.chunkMetadata.sourceField ?? 'notes'),
        chunkIndex: Number(record.chunkMetadata.chunkIndex ?? 0),
      }))
      .filter((item) => item.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);

    const response: RetrievalResponse = {
      query,
      results,
      total: results.length,
      latencyMs: performance.now() - started,
      rlsContext: { role, userId },
    };

    this.audit.publishAuditEvent({
      actorId: userId,
      actorRole: role,
      operation: 'ai_retrieval',
      resourceType: 'Embedding',
      resourceId: userId,
      metadata: {
        action: 'rag.retrieve',
        query,
        result_count: results.length,
        company_ids: results.map((item) => item.companyId),
        rls_session: sessionStatements,
      },
    });

    return response;
  }

  directorSeesMoreResultsThanIntern(query: string): Promise<boolean> {
    return Promise.all([
      this.retrieve(query, 'director-1', UserRole.DIRECTOR, 10),
      this.retrieve(query, 'intern-1', UserRole.INTERN, 10),
    ]).then(([director, intern]) => director.total >= intern.total);
  }
}
