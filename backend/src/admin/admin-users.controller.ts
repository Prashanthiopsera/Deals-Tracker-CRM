import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { UserRole } from '../database/enums';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  private actor(req: Request & { user: AuthUserContext }) {
    if (req.user.p7vcRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return { id: req.user.p7vcUserId, role: req.user.p7vcRole };
  }

  @Get()
  @CedarAuthorize('read', 'User')
  list(
    @Query('role') role?: UserRole,
    @Query('status') status?: 'active' | 'inactive' | 'pending',
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Req() req?: Request & { user: AuthUserContext },
  ) {
    this.actor(req!);
    return this.users.list({ role, status, page, pageSize });
  }

  @Post('invite')
  @CedarAuthorize('create', 'User')
  inviteViaPath(
    @Body() body: { email: string; fullName: string; role: UserRole },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.users.invite(body.email, body.fullName, body.role, actor.id, actor.role);
  }

  @Post()
  @CedarAuthorize('create', 'User')
  invite(
    @Body() body: { email: string; fullName: string; role: UserRole },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.users.invite(body.email, body.fullName, body.role, actor.id, actor.role);
  }

  @Patch(':id/role')
  @CedarAuthorize('update', 'User')
  changeRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.users.changeRole(id, body.role, actor.id, actor.role);
  }

  @Patch(':id/deactivate')
  @CedarAuthorize('update', 'User')
  deactivate(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    const actor = this.actor(req);
    return this.users.deactivate(id, actor.id, actor.role);
  }

  @Patch(':id/reactivate')
  @CedarAuthorize('update', 'User')
  reactivate(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    const actor = this.actor(req);
    return this.users.reactivate(id, actor.id, actor.role);
  }
}
