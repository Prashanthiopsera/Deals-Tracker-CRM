import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface AgentQueueMessage {
  taskId: string;
  agentType: string;
}

@Injectable()
export class AgentQueueService {
  readonly queue: AgentQueueMessage[] = [];
  readonly dlq: AgentQueueMessage[] = [];
  private receiveCounts = new Map<string, number>();

  publish(message: AgentQueueMessage): void {
    this.queue.push(message);
  }

  consume(): AgentQueueMessage | undefined {
    return this.queue.shift();
  }

  markFailed(message: AgentQueueMessage): void {
    const count = (this.receiveCounts.get(message.taskId) ?? 0) + 1;
    this.receiveCounts.set(message.taskId, count);
    if (count >= 3) {
      this.dlq.push(message);
    } else {
      this.queue.push(message);
    }
  }
}

export function buildAgentQueueConfig() {
  return { maxReceiveCount: 3, dlqRetentionDays: 14, queueName: 'AgentQueue' };
}
