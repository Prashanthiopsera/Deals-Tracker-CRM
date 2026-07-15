import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { AdminConnectorsService } from './admin-connectors.service';

@Controller('admin/connectors')
@UseGuards(JwtAuthGuard)
export class AdminConnectorsController {
  constructor(private readonly connectors: AdminConnectorsService) {}

  @Get()
  @CedarAuthorize('read', 'Connector')
  list(@Req() req: Request & { user: AuthUserContext }) {
    return this.connectors.list(req.user.p7vcRole);
  }

  @Get('health')
  @CedarAuthorize('read', 'Connector')
  health(@Req() req: Request & { user: AuthUserContext }) {
    return this.connectors.aggregateHealth(req.user.p7vcRole);
  }

  @Get(':id')
  @CedarAuthorize('read', 'Connector')
  get(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.connectors.get(id, req.user.p7vcRole);
  }

  @Patch(':id/config')
  @CedarAuthorize('update', 'Connector')
  updateConfig(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.connectors.updateConfig(id, body, req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Patch(':id/credentials')
  @CedarAuthorize('update', 'Connector')
  rotateCredentials(
    @Param('id') id: string,
    @Body() body: Record<string, string>,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.connectors.rotateCredentials(id, body, req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Post(':id/test')
  @CedarAuthorize('update', 'Connector')
  test(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.connectors.testConnectivity(id, req.user.p7vcUserId, req.user.p7vcRole);
  }
}
