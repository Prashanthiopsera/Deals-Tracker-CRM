import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { AutomationController } from './automation.controller';
import { AutomationEngineService, AutomationRulesService } from './automation.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [AutomationController],
  providers: [
    AutomationRulesService,
    {
      provide: AutomationEngineService,
      useFactory: (rules: AutomationRulesService, audit: AuditService) =>
        new AutomationEngineService(rules, audit),
      inject: [AutomationRulesService, AuditService],
    },
  ],
  exports: [AutomationRulesService, AutomationEngineService],
})
export class AutomationModule {}
