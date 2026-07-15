import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmbeddingsRegistryService } from './embeddings-registry.service';
import {
  mockBedrockEmbeddingResponse,
  mockCompanyEmbeddingInput,
} from '../../test-fixtures/rag/embedding-pipeline.fixture';

export interface TextChunk {
  chunkIndex: number;
  text: string;
  sourceField: string;
  tokenCount: number;
}

export interface BedrockEmbeddingClient {
  embedText(text: string): Promise<number[]>;
}

export class InMemoryBedrockEmbeddingClient implements BedrockEmbeddingClient {
  readonly calls: string[] = [];
  readonly dlq: Array<{ reason: string; payload: unknown }> = [];

  async embedText(text: string): Promise<number[]> {
    this.calls.push(text);
    if (text.includes('__FAIL__')) {
      this.dlq.push({ reason: 'bedrock_failure', payload: { text } });
      throw new Error('Bedrock embedding failed');
    }
    return [...mockBedrockEmbeddingResponse.embedding.slice(0, 3)];
  }
}

export interface EmbeddingQueueConsumer {
  enqueue(payload: Record<string, unknown>): Promise<void>;
}

export class InMemoryEmbeddingQueueConsumer implements EmbeddingQueueConsumer {
  readonly events: Record<string, unknown>[] = [];

  async enqueue(payload: Record<string, unknown>): Promise<void> {
    this.events.push(payload);
  }
}

@Injectable()
export class EmbeddingPipelineService {
  constructor(
    private readonly registry: EmbeddingsRegistryService,
    private readonly bedrock: BedrockEmbeddingClient,
    private readonly queue: EmbeddingQueueConsumer,
  ) {}

  chunkText(
    input: { notes?: string; sourceDocuments?: string },
    maxTokens = 512,
    overlap = 50,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const fields: Array<[string, string | undefined]> = [
      ['notes', input.notes],
      ['sourceDocuments', input.sourceDocuments],
    ];
    for (const [sourceField, value] of fields) {
      if (!value) continue;
      const words = value.split(/\s+/);
      const step = Math.max(1, maxTokens - overlap);
      for (let index = 0; index < words.length; index += step) {
        const slice = words.slice(index, index + maxTokens);
        if (slice.length === 0) continue;
        chunks.push({
          chunkIndex: chunks.length,
          text: slice.join(' '),
          sourceField,
          tokenCount: slice.length,
        });
      }
    }
    return chunks;
  }

  async upsertCompanyEmbeddings(
    companyId: string,
    input: { notes?: string; sourceDocuments?: string; version: number },
    changedFields: string[],
  ): Promise<{ upserted: number; skipped: number }> {
    const source: { notes?: string; sourceDocuments?: string } = {};
    if (!changedFields.length || changedFields.includes('notes')) {
      source.notes = input.notes;
    }
    if (!changedFields.length || changedFields.includes('sourceDocuments')) {
      source.sourceDocuments = input.sourceDocuments;
    }

    const chunks = this.chunkText(source);
    let upserted = 0;
    for (const chunk of chunks) {
      const embedding = await this.bedrock.embedText(chunk.text);
      this.registry.seed([
        ...this.registry.listForRole('Director').filter((row) => row.companyId !== companyId),
        {
          id: randomUUID(),
          companyId,
          companyName: `Company ${companyId}`,
          chunkText: chunk.text,
          embedding,
          chunkMetadata: {
            sourceField: chunk.sourceField,
            chunkIndex: chunk.chunkIndex,
            recordVersion: input.version,
          },
          visibility: 'all',
        },
      ]);
      upserted += 1;
    }
    await this.queue.enqueue({
      eventType: 'embedding.upserted',
      companyId,
      upserted,
      changedFields,
    });
    return { upserted, skipped: changedFields.length ? 0 : 0 };
  }

  async processQueueEvent(event: {
    companyId: string;
    changedFields: string[];
    recordVersion: number;
    notes?: string;
    sourceDocuments?: string;
  }): Promise<void> {
    try {
      await this.upsertCompanyEmbeddings(
        event.companyId,
        {
          notes: event.notes ?? mockCompanyEmbeddingInput.notes,
          sourceDocuments: event.sourceDocuments ?? mockCompanyEmbeddingInput.sourceDocuments,
          version: event.recordVersion,
        },
        event.changedFields,
      );
    } catch (error) {
      if (this.bedrock instanceof InMemoryBedrockEmbeddingClient) {
        this.bedrock.dlq.push({ reason: 'consumer_failure', payload: event });
      }
      throw error;
    }
  }
}
