import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { sampleAiAuditEvents } from '../../test-fixtures/rag/ai-audit.fixture';

export interface AiAuditLogRecord {
  id: string;
  userId: string;
  userRole: string;
  interactionType: 'chat' | 'retrieval';
  promptText: string;
  responseText: string | null;
  retrievedChunkIds: string[];
  retrievedCompanyIds: string[];
  modelId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  piiRedactionsApplied: Record<string, unknown>[];
  createdAt: string;
}

export interface AiAuditQueuePublisher {
  publish(event: Omit<AiAuditLogRecord, 'id' | 'createdAt'>): Promise<void>;
}

export class InMemoryAiAuditQueuePublisher implements AiAuditQueuePublisher {
  readonly dlq: Array<{ reason: string; payload: unknown }> = [];
  readonly events: Array<Omit<AiAuditLogRecord, 'id' | 'createdAt'>> = [];

  async publish(event: Omit<AiAuditLogRecord, 'id' | 'createdAt'>): Promise<void> {
    if (!event.userId || !event.interactionType) {
      this.dlq.push({ reason: 'invalid_schema', payload: event });
      throw new Error('Invalid AI audit event');
    }
    this.events.push(event);
  }
}

@Injectable()
export class AiAuditConsumer {
  private readonly logs: AiAuditLogRecord[] = sampleAiAuditEvents.map((event) => ({
    id: randomUUID(),
    ...event,
    createdAt: new Date().toISOString(),
  }));

  constructor(private readonly queue: InMemoryAiAuditQueuePublisher) {}

  async persistFromQueue(): Promise<number> {
    let inserted = 0;
    while (this.queue.events.length > 0) {
      const event = this.queue.events.shift()!;
      this.logs.push({
        id: randomUUID(),
        ...event,
        createdAt: new Date().toISOString(),
      });
      inserted += 1;
    }
    return inserted;
  }

  query(filters: {
    userId?: string;
    interactionType?: 'chat' | 'retrieval';
    companyId?: string;
  }): AiAuditLogRecord[] {
    return this.logs.filter((log) => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.interactionType && log.interactionType !== filters.interactionType) return false;
      if (filters.companyId && !log.retrievedCompanyIds.includes(filters.companyId)) return false;
      return true;
    });
  }

  count(): number {
    return this.logs.length;
  }
}

@Injectable()
export class AiAuditLogService {
  constructor(
    private readonly queue: InMemoryAiAuditQueuePublisher,
    private readonly consumer: AiAuditConsumer,
  ) {}

  async recordInteraction(event: Omit<AiAuditLogRecord, 'id' | 'createdAt'>): Promise<void> {
    await this.queue.publish(event);
    await this.consumer.persistFromQueue();
  }

  search(filters: {
    userId?: string;
    interactionType?: 'chat' | 'retrieval';
    companyId?: string;
  }) {
    return this.consumer.query(filters);
  }
}
