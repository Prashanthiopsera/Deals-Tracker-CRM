import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Post()
  @CedarAuthorize('read', 'Company')
  create(
    @Body() body: { format?: 'csv' | 'xlsx'; filters?: Record<string, string> },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    try {
      return this.exports.createExport({
        actorId: req.user.p7vcUserId,
        role: req.user.p7vcRole,
        format: body.format ?? 'csv',
        filters: body.filters ?? {},
      });
    } catch (error) {
      if (String(error).includes('Forbidden')) {
        throw new ForbiddenException({ message: 'Interns cannot export data' });
      }
      throw error;
    }
  }
}
