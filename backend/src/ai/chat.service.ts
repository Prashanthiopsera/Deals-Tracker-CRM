import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AiRetrievalAuditService } from '../audit/ai-retrieval-audit.service';
import { PiiRedactionService } from '../ai/pii-redaction.service';
import { RetrievalService } from '../rag/retrieval.service';
import {
  mockChatPrompts,
  mockClaudeResponse,
  mockUnavailableBedrockError,
} from '../../test-fixtures/rag/chat.fixture';

export interface ClaudeClient {
  invoke(prompt: string, context: string): Promise<{
    content: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
  }>;
}

export class InMemoryClaudeClient implements ClaudeClient {
  circuitOpen = false;

  async invoke(prompt: string, context: string) {
    if (this.circuitOpen) {
      throw mockUnavailableBedrockError;
    }
    return {
      content: `${mockClaudeResponse.content}\nContext size: ${context.length}. Prompt: ${prompt}`,
      modelId: mockClaudeResponse.modelId,
      inputTokens: mockClaudeResponse.inputTokens,
      outputTokens: mockClaudeResponse.outputTokens,
    };
  }
}

@Injectable()
export class ChatService {
  private readonly requestCounts = new Map<string, number[]>();
  private readonly rateLimitPerMinute = 20;

  constructor(
    private readonly retrieval: RetrievalService,
    private readonly redaction: PiiRedactionService,
    private readonly claude: InMemoryClaudeClient,
    private readonly audit: AuditService,
    private readonly aiAudit: AiRetrievalAuditService,
  ) {}

  async chat(message: string, userId: string, role: string) {
    this.enforceRateLimit(userId);
    const started = performance.now();
    const retrieval = await this.retrieval.retrieve(message, userId, role, 5);
    const context = retrieval.results.map((item) => item.chunkText).join('\n');
    const systemPrompt =
      'Use only provided context. Do not fabricate data. Apply PII redaction rules.';

    let modelResponse;
    try {
      modelResponse = await this.claude.invoke(message, `${systemPrompt}\n${context}`);
    } catch {
      throw new ServiceUnavailableException(
        'The AI assistant is temporarily unavailable. Please try again later.',
      );
    }

    const redacted = this.redaction.redactRagPayload(
      {
        entityType: 'Contact',
        records: [{ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' }],
        narrative: modelResponse.content,
      },
      userId,
      role,
    );

    const latencyMs = performance.now() - started;
    this.aiAudit.publishRetrieval({
      actorId: userId,
      actorRole: role,
      resourceType: 'AiChat',
      resourceId: userId,
      prompt: message,
      response: redacted.narrative,
      retrievedChunkIds: retrieval.results.map((item) => item.companyId),
      modelId: modelResponse.modelId,
      piiRedactedFields: redacted.redactionEvents
        .filter((event) => event.redactionAction === 'masked')
        .map((event) => event.fieldName),
      retrievalLatencyMs: retrieval.latencyMs,
      inferenceLatencyMs: latencyMs - retrieval.latencyMs,
      rlsContext: retrieval.rlsContext,
    });

    return {
      message: redacted.narrative,
      retrievedChunks: retrieval.results.length,
      modelId: modelResponse.modelId,
      latencyMs,
      tokenCount: modelResponse.inputTokens + modelResponse.outputTokens,
    };
  }

  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const windowStart = now - 60_000;
    const timestamps = (this.requestCounts.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= this.rateLimitPerMinute) {
      throw new HttpException('Chat rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    timestamps.push(now);
    this.requestCounts.set(userId, timestamps);
  }
}

export { mockChatPrompts };
