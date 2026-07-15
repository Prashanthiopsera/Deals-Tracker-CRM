import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { DigestController } from './digest.controller';
import { EmailDigestService } from './email-digest.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [DigestController],
  providers: [
    {
      provide: EmailDigestService,
      useFactory: (audit: AuditService) => new EmailDigestService(audit),
      inject: [AuditService],
    },
  ],
  exports: [EmailDigestService],
})
export class DigestModule {}
