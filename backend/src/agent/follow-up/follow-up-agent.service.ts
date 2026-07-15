import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AgentTaskService } from '../agent-task.service';
import {
  extractFollowUpsFromTranscript,
  redactFollowUpPii,
} from './follow-up-detector.service';

@Injectable()
export class FollowUpAgentService {
  constructor(
    private readonly tasks: AgentTaskService,
    private readonly audit: AuditService,
  ) {}

  onMeetingNotesIngested(input: {
    source: 'granola' | 'zoom';
    transcript: string;
    actorId: string;
  }) {
    try {
      const followUps = extractFollowUpsFromTranscript(input.transcript).map(redactFollowUpPii);
      const created = followUps.map((followUp) => {
        const task = this.tasks.createTask({
          agent_type: 'follow_up',
          payload: { source: input.source, transcript_id: `tx-${Date.now()}` },
          proposed_changes: followUp,
          acting_user_id: input.actorId,
        });
        this.tasks.submitForApproval(task.id, input.actorId);
        return task;
      });
      this.audit.publishAuditEvent({
        actorId: input.actorId,
        actorRole: 'Director',
        operation: 'create',
        resourceType: 'FollowUpAgent',
        resourceId: created[0]?.id ?? 'none',
        metadata: { action: 'follow_up.proposed', source: input.source, count: created.length },
      });
      return created;
    } catch (error) {
      const failed = this.tasks.createTask({
        agent_type: 'follow_up',
        payload: { source: input.source, error: String(error) },
        proposed_changes: {},
        acting_user_id: input.actorId,
      });
      this.tasks.markFailed(failed.id, String(error));
      return [failed];
    }
  }
}
