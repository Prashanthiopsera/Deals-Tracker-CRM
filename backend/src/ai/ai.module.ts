import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PiiModule } from '../pii/pii.module';
import { PiiRedactionService } from './pii-redaction.service';

@Module({
  imports: [AuditModule, PiiModule],
  providers: [PiiRedactionService],
  exports: [PiiRedactionService],
})
export class AiModule {}
