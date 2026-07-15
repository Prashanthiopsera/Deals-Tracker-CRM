import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { CompaniesService } from '../../companies/companies.service';
import { AgentTaskService } from '../agent-task.service';
import { EnrichmentConnectorsService } from './enrichment-connectors.service';
import { mapEnrichmentToCrmFields } from './enrichment-field-mapper';

const ENRICHMENT_ROLES = new Set(['Director', 'Principal', 'Associate', 'Admin']);

@Injectable()
export class EnrichmentAgentService {
  constructor(
    private readonly tasks: AgentTaskService,
    private readonly connectors: EnrichmentConnectorsService,
    private readonly companies: CompaniesService,
    private readonly audit: AuditService,
  ) {}

  async triggerOnCompanyCreate(input: {
    companyId: string;
    companyName: string;
    actorId: string;
    actorRole: string;
    userEnteredFields?: Record<string, unknown>;
  }) {
    if (!ENRICHMENT_ROLES.has(input.actorRole)) {
      return null;
    }

    try {
      const sources = await Promise.all([
        this.connectors.fetchZoomInfo(input.companyName),
        this.connectors.fetchApollo(input.companyName),
      ]);
      const proposed = mapEnrichmentToCrmFields(sources);
      const task = this.tasks.createTask({
        agent_type: 'enrichment',
        payload: {
          company_id: input.companyId,
          user_entered: input.userEnteredFields ?? {},
        },
        proposed_changes: proposed,
        acting_user_id: input.actorId,
      });
      this.tasks.submitForApproval(task.id, input.actorId);
      this.audit.publishAuditEvent({
        actorId: input.actorId,
        actorRole: input.actorRole,
        operation: 'create',
        resourceType: 'EnrichmentAgent',
        resourceId: task.id,
        metadata: { action: 'enrichment.proposed', sources: proposed.sources },
      });
      return task;
    } catch (error) {
      const failed = this.tasks.createTask({
        agent_type: 'enrichment',
        payload: { company_id: input.companyId, error: String(error) },
        proposed_changes: {},
        acting_user_id: input.actorId,
      });
      this.tasks.markFailed(failed.id, String(error));
      return failed;
    }
  }

  async approvePartial(
    taskId: string,
    approverId: string,
    role: string,
    approvedFields: Record<string, unknown>,
    rejectedFields: string[] = [],
  ) {
    const task = await this.tasks.approvePartial(
      taskId,
      approverId,
      role,
      approvedFields,
      rejectedFields,
    );
    const companyId = String(task.payload.company_id ?? '');
    if (companyId && Object.keys(approvedFields).length > 0) {
      await this.companies.patch(
        companyId,
        {
          company_name: approvedFields.company_name as string | undefined,
          notes: (approvedFields.description ?? approvedFields.notes) as string | undefined,
        },
        approverId,
        role,
      );
    }
    this.audit.publishAuditEvent({
      actorId: approverId,
      actorRole: role,
      operation: 'update',
      resourceType: 'EnrichmentAgent',
      resourceId: taskId,
      metadata: {
        action: 'enrichment.approved_partial',
        approvedFields,
        rejectedFields,
      },
    });
    return task;
  }
}
