import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditService } from '../audit/audit.service';
import { CoInvestorService } from './co-investor.service';
import { RelationshipController } from './relationship.controller';
import { RelationshipScoringService } from './relationship-scoring.service';
import { WarmIntroPathService } from './warm-intro-path.service';

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [RelationshipController],
  providers: [
    WarmIntroPathService,
    CoInvestorService,
    {
      provide: RelationshipScoringService,
      useFactory: (audit: AuditService) => new RelationshipScoringService(audit),
      inject: [AuditService],
    },
  ],
  exports: [RelationshipScoringService, WarmIntroPathService, CoInvestorService],
})
export class RelationshipModule {}
