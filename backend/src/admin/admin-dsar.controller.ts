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
import { AdminDsarService } from './admin-dsar.service';

@Controller('admin/dsar')
@UseGuards(JwtAuthGuard)
export class AdminDsarController {
  constructor(private readonly dsar: AdminDsarService) {}

  private actor(req: Request & { user: AuthUserContext }) {
    if (req.user.p7vcRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return { id: req.user.p7vcUserId, role: req.user.p7vcRole };
  }

  @Post('discover')
  @CedarAuthorize('create', 'DsarRequest')
  discover(
    @Body() body: { email: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.discover(body.email, actor.id, actor.role);
  }

  @Post('export/:requestId')
  @CedarAuthorize('update', 'DsarRequest')
  export(
    @Param('requestId') requestId: string,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.exportRequest(requestId, actor.id, actor.role);
  }

  @Post('erase/:requestId')
  @CedarAuthorize('delete', 'DsarRequest')
  erase(
    @Param('requestId') requestId: string,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.dsar.eraseRequest(requestId, actor.id, actor.role);
  }
}
