import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ReportGenerationService } from './report-generation.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportGenerationService) {}

  @Post('lp-partner')
  @CedarAuthorize('read', 'Company')
  create(
    @Body() body: { formats?: string[]; filters?: Record<string, string> },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    try {
      const job = this.reports.enqueue({
        actorId: req.user.p7vcUserId,
        role: req.user.p7vcRole,
        formats: body.formats ?? ['pdf'],
        filters: body.filters ?? {},
      });
      return { job_id: job.id, status: job.status, accepted: true };
    } catch {
      throw new ForbiddenException({ message: 'Report generation restricted to Director/Principal' });
    }
  }

  @Get(':jobId')
  @CedarAuthorize('read', 'Company')
  status(@Param('jobId') jobId: string) {
    return this.reports.getJob(jobId) ?? { status: 'failed', error: 'Job not found' };
  }
}
