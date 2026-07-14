import {
  Body,
  Controller,
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

  @Get()
  @CedarAuthorize('read', 'User')
  list(
    @Query('role') role?: UserRole,
    @Query('status') status?: 'active' | 'inactive' | 'pending',
  ) {
    return this.users.list({ role, status });
  }

  @Post()
  @CedarAuthorize('create', 'User')
  invite(
    @Body() body: { email: string; fullName: string; role: UserRole },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.users.invite(body.email, body.fullName, body.role, req.user.p7vcUserId);
  }

  @Patch(':id/role')
  @CedarAuthorize('update', 'User')
  changeRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.users.changeRole(id, body.role, req.user.p7vcUserId);
  }

  @Patch(':id/deactivate')
  @CedarAuthorize('update', 'User')
  deactivate(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.users.deactivate(id, req.user.p7vcUserId);
  }
}
