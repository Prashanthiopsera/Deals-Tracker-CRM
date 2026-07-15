import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesModule } from '../companies/companies.module';
import { AiModule } from '../ai/ai.module';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { PiiRedactionService } from '../ai/pii-redaction.service';
import { InMemoryClaudeClient } from '../ai/chat.service';
import { AgentQueueService } from './agent-queue.service';
import { AgentTaskService } from './agent-task.service';
import { AgentTasksController } from './agent-tasks.controller';
import { DealMemoAgentService } from './deal-memo/deal-memo-agent.service';
import { DealMemoController } from './deal-memo/deal-memo.controller';
import { FollowUpAgentService } from './follow-up/follow-up-agent.service';
import { EnrichmentAgentService } from './enrichment/enrichment-agent.service';
import { EnrichmentConnectorsService } from './enrichment/enrichment-connectors.service';
import { EnrichmentController } from './enrichment/enrichment.controller';
import { CompanyEnrichmentTrigger } from '../companies/company-enrichment.trigger';
import { AgentObservabilityService } from './agent-observability.service';
import { PipelineMonitorAgentService } from './pipeline-monitor/pipeline-monitor-agent.service';

@Module({
  imports: [AuditModule, AuthorizationModule, AiModule, forwardRef(() => CompaniesModule)],
  controllers: [AgentTasksController, EnrichmentController, DealMemoController],
  providers: [
    AgentQueueService,
    AgentObservabilityService,
    EnrichmentConnectorsService,
    {
      provide: AgentTaskService,
      useFactory: (
        queue: AgentQueueService,
        cedar: CedarAuthorizationService,
        audit: AuditService,
      ) => new AgentTaskService(queue, cedar, audit),
      inject: [AgentQueueService, CedarAuthorizationService, AuditService],
    },
    {
      provide: EnrichmentAgentService,
      useFactory: (
        tasks: AgentTaskService,
        connectors: EnrichmentConnectorsService,
        companies: CompaniesService,
        audit: AuditService,
      ) => new EnrichmentAgentService(tasks, connectors, companies, audit),
      inject: [AgentTaskService, EnrichmentConnectorsService, CompaniesService, AuditService],
    },
    {
      provide: CompanyEnrichmentTrigger,
      useFactory: (enrichment: EnrichmentAgentService) => new CompanyEnrichmentTrigger(enrichment),
      inject: [EnrichmentAgentService],
    },
    {
      provide: DealMemoAgentService,
      useFactory: (
        tasks: AgentTaskService,
        companies: CompaniesService,
        claude: InMemoryClaudeClient,
        redaction: PiiRedactionService,
        audit: AuditService,
      ) => new DealMemoAgentService(tasks, companies, claude, redaction, audit),
      inject: [
        AgentTaskService,
        CompaniesService,
        InMemoryClaudeClient,
        PiiRedactionService,
        AuditService,
      ],
    },
    {
      provide: FollowUpAgentService,
      useFactory: (tasks: AgentTaskService, audit: AuditService) =>
        new FollowUpAgentService(tasks, audit),
      inject: [AgentTaskService, AuditService],
    },
    {
      provide: PipelineMonitorAgentService,
      useFactory: (tasks: AgentTaskService, audit: AuditService) =>
        new PipelineMonitorAgentService(tasks, audit),
      inject: [AgentTaskService, AuditService],
    },
  ],
  exports: [AgentTaskService, AgentQueueService, EnrichmentAgentService, CompanyEnrichmentTrigger],
})
export class AgentModule {}
