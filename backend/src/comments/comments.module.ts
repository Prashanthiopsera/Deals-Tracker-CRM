import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [CommentsController],
  providers: [
    {
      provide: CommentsService,
      useFactory: (audit: AuditService) => new CommentsService(audit),
      inject: [AuditService],
    },
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
