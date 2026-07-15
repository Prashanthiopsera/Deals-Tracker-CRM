import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AgentTaskService } from '../agent-task.service';
import { scanPipeline } from './pipeline-monitor.service';

@Injectable()
export class PipelineMonitorAgentService {
  constructor(
    private readonly tasks: AgentTaskService,
    private readonly audit: AuditService,
  ) {}

  runDailyScan(serviceUserId: string) {
    const flagged = scanPipeline();
    const created = flagged.map(({ company, staleness, expirySoon }) => {
      const task = this.tasks.createTask({
        agent_type: 'pipeline_monitor',
        payload: { company_id: company.id, deal_lead_id: company.deal_lead_id },
        proposed_changes: {
          company_id: company.id,
          current_stage: company.deal_stage,
          days_in_stage: staleness.daysInStage,
          last_updated: company.updated_at,
          recommended_action: expirySoon ? 'Review term sheet expiry' : 'Review stale deal',
        },
        acting_user_id: serviceUserId,
      });
      this.tasks.submitForApproval(task.id, serviceUserId);
      return task;
    });
    this.audit.publishAuditEvent({
      actorId: serviceUserId,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'PipelineMonitorAgent',
      resourceId: created[0]?.id ?? 'scan',
      metadata: { action: 'pipeline_monitor.scan', flagged: created.length },
    });
    return created;
  }
}
