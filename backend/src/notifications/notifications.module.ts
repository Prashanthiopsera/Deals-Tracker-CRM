import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { MentionNotificationService } from './mention-notification.service';

@Module({
  imports: [AuditModule],
  providers: [
    {
      provide: MentionNotificationService,
      useFactory: (audit: AuditService) => new MentionNotificationService(audit),
      inject: [AuditService],
    },
  ],
  exports: [MentionNotificationService],
})
export class NotificationsModule {}
