import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import { AnalyticsService } from './analytics.service';
import { StageTransitionHistoryService } from './stage-transition-history.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [AnalyticsController],
  providers: [StageTransitionHistoryService, AnalyticsMetricsService, AnalyticsService],
  exports: [AnalyticsService, StageTransitionHistoryService, AnalyticsMetricsService],
})
export class AnalyticsModule {}
