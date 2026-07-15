import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { PresenceService } from './presence.service';
import { SharedViewsService } from './shared-views.service';

@Controller('collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(
    private readonly sharedViews: SharedViewsService,
    private readonly presence: PresenceService,
  ) {}

  @Get('shared-views')
  @CedarAuthorize('read', 'Company')
  listViews(@Req() req: Request & { user: AuthUserContext }) {
    return this.sharedViews.listForUser(req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Post('shared-views')
  @CedarAuthorize('create', 'Company')
  createView(
    @Body() body: { name: string; visibility: 'private' | 'role-based' | 'all'; filters: Record<string, string> },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.sharedViews.create({
      name: body.name,
      owner_id: req.user.p7vcUserId,
      visibility: body.visibility,
      filters: body.filters,
    });
  }

  @Post('presence/:companyId/heartbeat')
  @CedarAuthorize('read', 'Company')
  heartbeat(@Param('companyId') companyId: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.presence.heartbeat(req.user.p7vcUserId, companyId);
  }

  @Get('presence/:companyId')
  @CedarAuthorize('read', 'Company')
  viewers(@Param('companyId') companyId: string) {
    return { viewers: this.presence.listViewers(companyId) };
  }

  @Delete('presence/:companyId')
  @CedarAuthorize('read', 'Company')
  leave(@Param('companyId') companyId: string, @Req() req: Request & { user: AuthUserContext }) {
    this.presence.leave(req.user.p7vcUserId, companyId);
    return { ok: true };
  }
}
