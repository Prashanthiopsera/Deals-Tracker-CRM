import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { DsarService } from './dsar.service';

@Controller('dsar')
@UseGuards(JwtAuthGuard)
export class DsarController {
  constructor(private readonly dsar: DsarService) {}

  private actor(req: Request & { user: AuthUserContext }) {
    if (req.user.p7vcRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return { id: req.user.p7vcUserId, role: req.user.p7vcRole };
  }

  @Post()
  @CedarAuthorize('create', 'DsarRequest')
  create(
    @Body() body: { subjectIdentifier: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.createRequest(body.subjectIdentifier, actor.id, actor.role);
  }

  @Post(':requestId/export')
  @CedarAuthorize('update', 'DsarRequest')
  export(
    @Param('requestId') requestId: string,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.generateExport(requestId, actor.id, actor.role);
  }

  @Post(':requestId/sla-check')
  @CedarAuthorize('update', 'DsarRequest')
  slaCheck(
    @Param('requestId') requestId: string,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.evaluateSla(requestId, actor.role);
  }
}
