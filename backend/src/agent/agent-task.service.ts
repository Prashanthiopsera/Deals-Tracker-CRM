import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import {
  assertAuthorized,
  buildAuthRequest,
  CedarAuthorizationService,
} from '../authorization/cedar.service';
import { AgentQueueService } from './agent-queue.service';
import { AgentTask, AgentTaskStatus, AgentTaskTransition, AgentType } from './agent.types';

const VALID_TRANSITIONS: Record<AgentTaskStatus, AgentTaskStatus[]> = {
  proposed: ['pending_approval', 'rejected'],
  pending_approval: ['approved', 'rejected'],
  approved: ['executed', 'failed'],
  rejected: [],
  executed: [],
  failed: [],
};

@Injectable()
export class AgentTaskService {
  private tasks = new Map<string, AgentTask>();
  private transitions = new Map<string, AgentTaskTransition[]>();

  constructor(
    private readonly queue: AgentQueueService,
    private readonly cedar: CedarAuthorizationService,
    private readonly audit: AuditService,
  ) {}

  createTask(input: {
    agent_type: AgentType;
    payload: Record<string, unknown>;
    proposed_changes: Record<string, unknown>;
    acting_user_id: string;
  }): AgentTask {
    const now = new Date().toISOString();
    const task: AgentTask = {
      id: randomUUID(),
      agent_type: input.agent_type,
      status: 'proposed',
      payload: input.payload,
      proposed_changes: input.proposed_changes,
      acting_user_id: input.acting_user_id,
      created_at: now,
      updated_at: now,
      audit_trail_id: randomUUID(),
    };
    this.tasks.set(task.id, task);
    this.recordTransition(task.id, 'proposed', 'proposed', input.acting_user_id);
    this.queue.publish({ taskId: task.id, agentType: task.agent_type });
    return task;
  }

  listTasks(actorId: string, page = 1, limit = 20) {
    const items = [...this.tasks.values()]
      .filter((task) => task.acting_user_id === actorId || task.status === 'pending_approval')
      .slice((page - 1) * limit, page * limit);
    return { items, page, limit, total: this.tasks.size };
  }

  async approve(taskId: string, approverId: string, role: string): Promise<AgentTask> {
    const task = this.getTask(taskId);
    this.assertTransition(task.status, 'approved');
    const decision = await this.cedar.authorize(
      buildAuthRequest({ p7vcUserId: approverId, p7vcRole: role }, 'create', 'Company'),
    );
    if (!decision.allowed) {
      return this.reject(taskId, approverId, role, 'Cedar denied proposed write action');
    }
    try {
      assertAuthorized(decision);
    } catch {
      return this.reject(taskId, approverId, role, 'Cedar denied proposed write action');
    }

    const before = task.status;
    task.status = 'approved';
    task.approved_at = new Date().toISOString();
    task.approved_by = approverId;
    task.updated_at = task.approved_at;
    this.recordTransition(task.id, before, 'approved', approverId);
    task.status = 'executed';
    task.updated_at = new Date().toISOString();
    this.recordTransition(task.id, 'approved', 'executed', approverId);
    this.publishAudit(task, 'approve');
    return task;
  }

  reject(taskId: string, approverId: string, _role: string, reason?: string): AgentTask {
    const task = this.getTask(taskId);
    this.assertTransition(task.status, 'rejected');
    const before = task.status;
    task.status = 'rejected';
    task.updated_at = new Date().toISOString();
    this.recordTransition(task.id, before, 'rejected', approverId, reason);
    this.publishAudit(task, 'reject', reason);
    return task;
  }

  submitForApproval(taskId: string, actorId: string): AgentTask {
    const task = this.getTask(taskId);
    this.assertTransition(task.status, 'pending_approval');
    const before = task.status;
    task.status = 'pending_approval';
    task.updated_at = new Date().toISOString();
    this.recordTransition(task.id, before, 'pending_approval', actorId);
    return task;
  }

  getTransitions(taskId: string): AgentTaskTransition[] {
    return this.transitions.get(taskId) ?? [];
  }

  seed(task: AgentTask): void {
    this.tasks.set(task.id, task);
  }

  private getTask(taskId: string): AgentTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new NotFoundException('Agent task not found');
    return task;
  }

  private assertTransition(from: AgentTaskStatus, to: AgentTaskStatus): void {
    const allowed = VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Invalid transition from ${from} to ${to}`);
    }
  }

  private recordTransition(
    taskId: string,
    from: AgentTaskStatus,
    to: AgentTaskStatus,
    actorId: string,
    reason?: string,
  ): void {
    const list = this.transitions.get(taskId) ?? [];
    list.push({ from, to, at: new Date().toISOString(), actor_id: actorId, reason });
    this.transitions.set(taskId, list);
  }

  private publishAudit(task: AgentTask, action: 'approve' | 'reject', reason?: string): void {
    this.audit.publishAuditEvent({
      actorId: task.approved_by ?? task.acting_user_id,
      actorRole: 'Director',
      operation: 'update',
      resourceType: 'AgentTask',
      resourceId: task.id,
      metadata: { action: `agent.task.${action}`, reason, status: task.status },
    });
  }
}
