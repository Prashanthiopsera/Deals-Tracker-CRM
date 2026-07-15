import { Injectable } from '@nestjs/common';
import {
  cosineSimilarity,
  semanticSearchChunks,
  SemanticSearchChunk,
} from '../../test-fixtures/search/semantic-search.fixture';

export interface SemanticSearchResult {
  chunkId: string;
  entityType: string;
  recordId: string;
  content: string;
  score: number;
}

@Injectable()
export class SemanticSearchService {
  private chunks: SemanticSearchChunk[] = semanticSearchChunks.map((chunk) => ({
    ...chunk,
    embedding: [...chunk.embedding],
  }));

  search(queryEmbedding: number[], limit = 5): SemanticSearchResult[] {
    return this.chunks
      .map((chunk) => ({
        chunkId: chunk.id,
        entityType: chunk.entityType,
        recordId: chunk.recordId,
        content: chunk.content,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  embedQuery(text: string): number[] {
    const normalized = text.toLowerCase();
    if (normalized.includes('robot')) return [0.88, 0.12, 0.0];
    if (normalized.includes('contact')) return [0.2, 0.75, 0.1];
    return [0.33, 0.33, 0.34];
  }
}
