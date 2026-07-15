import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { ActivitiesController } from './activities.controller';
import { ActivityIngestionService, ActivityQueueConsumer } from './activity-ingestion.service';
import { ActivityTimelineService } from './activity-timeline.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [ActivitiesController],
  providers: [
    {
      provide: ActivityIngestionService,
      useFactory: (audit: AuditService) => new ActivityIngestionService(audit),
      inject: [AuditService],
    },
    {
      provide: ActivityTimelineService,
      useFactory: (ingestion: ActivityIngestionService) => new ActivityTimelineService(ingestion),
      inject: [ActivityIngestionService],
    },
    {
      provide: ActivityQueueConsumer,
      useFactory: (ingestion: ActivityIngestionService) => new ActivityQueueConsumer(ingestion),
      inject: [ActivityIngestionService],
    },
  ],
  exports: [ActivityIngestionService, ActivityTimelineService, ActivityQueueConsumer],
})
export class ActivitiesModule {}
