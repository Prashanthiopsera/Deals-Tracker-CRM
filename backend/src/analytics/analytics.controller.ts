import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('pipeline-summary')
  @CedarAuthorize('read', 'Company')
  pipelineSummary(@Query() query: Record<string, string>) {
    return this.analytics.pipelineSummary(query);
  }

  @Get('conversion-rates')
  @CedarAuthorize('read', 'Company')
  conversionRates() {
    return this.analytics.conversionRates();
  }

  @Get('time-in-stage')
  @CedarAuthorize('read', 'Company')
  timeInStage() {
    return this.analytics.timeInStage();
  }

  @Get('deal-velocity')
  @CedarAuthorize('read', 'Company')
  dealVelocity(@Query('window_days') windowDays?: string) {
    return this.analytics.dealVelocity(Number(windowDays ?? 90));
  }

  @Get('workload')
  @CedarAuthorize('read', 'Company')
  workload(@Req() req: Request & { user: AuthUserContext }) {
    const includeOwnership = req.user.p7vcRole !== 'Intern';
    return this.analytics.workload(includeOwnership);
  }
}
