import { Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserContext } from '../../auth/auth.types';
import { CedarAuthorize } from '../../authorization/cedar.guard';
import { DealMemoAgentService } from './deal-memo-agent.service';

@Controller('api/companies')
export class DealMemoController {
  constructor(private readonly dealMemo: DealMemoAgentService) {}

  @Post(':id/generate-memo')
  @CedarAuthorize('read', 'Company')
  generate(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.dealMemo.generateMemo(id, req.user.p7vcUserId, req.user.p7vcRole);
  }
}
