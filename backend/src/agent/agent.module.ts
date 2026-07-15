import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { AgentQueueService } from './agent-queue.service';
import { AgentTaskService } from './agent-task.service';
import { AgentTasksController } from './agent-tasks.controller';
import { EnrichmentAgentService } from './enrichment/enrichment-agent.service';
import { EnrichmentConnectorsService } from './enrichment/enrichment-connectors.service';
import { EnrichmentController } from './enrichment/enrichment.controller';
import { CompanyEnrichmentTrigger } from '../companies/company-enrichment.trigger';

@Module({
  imports: [AuditModule, AuthorizationModule, forwardRef(() => CompaniesModule)],
  controllers: [AgentTasksController, EnrichmentController],
  providers: [
    AgentQueueService,
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
  ],
  exports: [AgentTaskService, AgentQueueService, EnrichmentAgentService, CompanyEnrichmentTrigger],
})
export class AgentModule {}
