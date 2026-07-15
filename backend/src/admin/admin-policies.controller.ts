import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { AdminPoliciesService } from './admin-policies.service';

@Controller('admin/policies')
@UseGuards(JwtAuthGuard)
export class AdminPoliciesController {
  constructor(private readonly policies: AdminPoliciesService) {}

  @Get()
  @CedarAuthorize('read', 'Policy')
  list(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Req() req?: Request & { user: AuthUserContext },
  ) {
    return this.policies.list(page, pageSize, req!.user.p7vcRole);
  }

  @Get(':id')
  @CedarAuthorize('read', 'Policy')
  get(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.policies.get(id, req.user.p7vcRole);
  }

  @Post()
  @CedarAuthorize('create', 'Policy')
  create(
    @Body() body: { description: string; policyText: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.policies.create(body.description, body.policyText, req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Patch(':id')
  @CedarAuthorize('update', 'Policy')
  update(
    @Param('id') id: string,
    @Body() body: { policyText: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.policies.update(id, body.policyText, req.user.p7vcUserId, req.user.p7vcRole);
  }
}
