import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserContext } from '../../auth/auth.types';
import { CedarAuthorize } from '../../authorization/cedar.guard';
import { EnrichmentAgentService } from './enrichment-agent.service';

@Controller('api/enrichment')
export class EnrichmentController {
  constructor(private readonly enrichment: EnrichmentAgentService) {}

  @Post('tasks/:id/approve-partial')
  @CedarAuthorize('update', 'Company')
  approvePartial(
    @Param('id') id: string,
    @Body() body: { approved_fields: Record<string, unknown>; rejected_fields?: string[] },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.enrichment.approvePartial(
      id,
      req.user.p7vcUserId,
      req.user.p7vcRole,
      body.approved_fields,
      body.rejected_fields ?? [],
    );
  }
}
