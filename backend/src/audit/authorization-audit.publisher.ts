import { Injectable, Logger } from '@nestjs/common';
import { AuthorizationAuditEvent } from './authorization-audit.types';

export interface AuditQueuePublisher {
  publish(message: AuthorizationAuditEvent): Promise<void>;
}

@Injectable()
export class InMemoryAuditQueuePublisher implements AuditQueuePublisher {
  readonly messages: AuthorizationAuditEvent[] = [];

  async publish(message: AuthorizationAuditEvent): Promise<void> {
    this.messages.push(message);
  }
}

@Injectable()
export class SqsAuditQueuePublisher implements AuditQueuePublisher {
  private readonly logger = new Logger(SqsAuditQueuePublisher.name);
  private client: import('@aws-sdk/client-sqs').SQSClient | null = null;

  private async getClient(): Promise<import('@aws-sdk/client-sqs').SQSClient | null> {
    if (!process.env.AUDIT_QUEUE_URL) return null;
    if (!this.client) {
      const { SQSClient } = await import('@aws-sdk/client-sqs');
      this.client = new SQSClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
    }
    return this.client;
  }

  async publish(message: AuthorizationAuditEvent): Promise<void> {
    const client = await this.getClient();
    const queueUrl = process.env.AUDIT_QUEUE_URL;
    if (!client || !queueUrl) return;

    try {
      const { SendMessageCommand } = await import('@aws-sdk/client-sqs');
      await client.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to publish authorization audit event: ${String(error)}`);
    }
  }
}

@Injectable()
export class LayeredAuditQueuePublisher implements AuditQueuePublisher {
  constructor(
    private readonly memory: InMemoryAuditQueuePublisher,
    private readonly sqs: SqsAuditQueuePublisher,
  ) {}

  async publish(message: AuthorizationAuditEvent): Promise<void> {
    await Promise.all([this.memory.publish(message), this.sqs.publish(message)]);
  }
}
