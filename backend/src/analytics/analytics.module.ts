import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { StageTransitionHistoryService } from './stage-transition-history.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [AnalyticsController],
  providers: [StageTransitionHistoryService, AnalyticsService],
  exports: [AnalyticsService, StageTransitionHistoryService],
})
export class AnalyticsModule {}
