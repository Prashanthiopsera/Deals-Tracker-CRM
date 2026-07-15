import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { ActivityIngestionService, ActivityQueueConsumer } from './activity-ingestion.service';

@Module({
  imports: [AuditModule],
  providers: [
    {
      provide: ActivityIngestionService,
      useFactory: (audit: AuditService) => new ActivityIngestionService(audit),
      inject: [AuditService],
    },
    {
      provide: ActivityQueueConsumer,
      useFactory: (ingestion: ActivityIngestionService) => new ActivityQueueConsumer(ingestion),
      inject: [ActivityIngestionService],
    },
  ],
  exports: [ActivityIngestionService, ActivityQueueConsumer],
})
export class ActivitiesModule {}
