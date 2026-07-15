import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { CedarAuthorizationService } from '../authorization/cedar.service';
import { AgentQueueService } from './agent-queue.service';
import { AgentTaskService } from './agent-task.service';
import { AgentTasksController } from './agent-tasks.controller';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [AgentTasksController],
  providers: [
    AgentQueueService,
    {
      provide: AgentTaskService,
      useFactory: (
        queue: AgentQueueService,
        cedar: CedarAuthorizationService,
        audit: AuditService,
      ) => new AgentTaskService(queue, cedar, audit),
      inject: [AgentQueueService, CedarAuthorizationService, AuditService],
    },
  ],
  exports: [AgentTaskService, AgentQueueService],
})
export class AgentModule {}
