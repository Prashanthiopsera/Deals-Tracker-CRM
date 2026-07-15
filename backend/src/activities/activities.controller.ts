import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ActivityListQuery, ActivityTimelineService } from './activity-timeline.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly timeline: ActivityTimelineService) {}

  @Get(':id/activities')
  @CedarAuthorize('read', 'Company')
  list(
    @Param('id') companyId: string,
    @Query() query: ActivityListQuery,
    @Req() _req: Request & { user: AuthUserContext },
  ) {
    return this.timeline.listByCompany(companyId, query);
  }
}
