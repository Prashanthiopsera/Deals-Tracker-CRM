import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { AdminAuditLogSearchQueryDto } from './admin-audit-logs.dto';
import { AdminAuditLogsService } from './admin-audit-logs.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
export class AdminAuditLogsController {
  constructor(private readonly auditLogs: AdminAuditLogsService) {}

  @Get()
  search(
    @Query() query: AdminAuditLogSearchQueryDto,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.auditLogs.search(query, {
      id: req.user.p7vcUserId,
      role: req.user.p7vcRole,
    });
  }
}
