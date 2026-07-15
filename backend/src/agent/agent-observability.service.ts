import { Injectable } from '@nestjs/common';
import { AgentTaskStatus, AgentType } from './agent.types';

export interface AgentObservabilityLog {
  task_id: string;
  agent_type: AgentType;
  status: AgentTaskStatus;
  acting_user_id: string;
  timestamp: string;
  duration_ms: number;
  error_details?: string;
}

@Injectable()
export class AgentObservabilityService {
  readonly logs: AgentObservabilityLog[] = [];
  readonly metrics: Array<{ metric: string; value: number }> = [];

  recordTransition(entry: AgentObservabilityLog): void {
    this.logs.push(entry);
    this.metrics.push({ metric: 'agent.task.transition', value: 1 });
    this.metrics.push({ metric: `agent.task.${entry.status}`, value: 1 });
  }
}
