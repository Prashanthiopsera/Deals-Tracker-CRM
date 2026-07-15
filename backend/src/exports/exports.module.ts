import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [ExportsController],
  providers: [
    {
      provide: ExportsService,
      useFactory: (audit: AuditService) => new ExportsService(audit),
      inject: [AuditService],
    },
  ],
  exports: [ExportsService],
})
export class ExportsModule {}
