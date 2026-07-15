import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from './audit.service';

export interface AiRetrievalAuditInput {
  actorId: string;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  prompt: string;
  response: string;
  retrievedChunkIds: string[];
  modelId: string;
  piiRedactedFields?: string[];
  retrievalLatencyMs: number;
  inferenceLatencyMs: number;
  rlsContext: Record<string, unknown>;
  correlationId?: string;
}

@Injectable()
export class AiRetrievalAuditService {
  constructor(private readonly audit: AuditService) {}

  publishRetrieval(input: AiRetrievalAuditInput): void {
    const totalLatencyMs = input.retrievalLatencyMs + input.inferenceLatencyMs;
    this.audit.publishAuditEvent({
      actorId: input.actorId,
      actorRole: input.actorRole,
      operation: 'ai_retrieval',
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      correlationId: input.correlationId ?? randomUUID(),
      metadata: {
        prompt: input.prompt,
        response: input.response,
        retrieved_chunk_ids: input.retrievedChunkIds,
        retrieved_chunk_count: input.retrievedChunkIds.length,
        model_id: input.modelId,
        pii_redacted_fields: input.piiRedactedFields ?? [],
        retrieval_latency_ms: input.retrievalLatencyMs,
        inference_latency_ms: input.inferenceLatencyMs,
        total_latency_ms: totalLatencyMs,
        rls_context: input.rlsContext,
      },
    });
  }
}
