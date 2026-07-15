import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [DocumentsController],
  providers: [
    {
      provide: DocumentsService,
      useFactory: (audit: AuditService) => new DocumentsService(audit),
      inject: [AuditService],
    },
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
