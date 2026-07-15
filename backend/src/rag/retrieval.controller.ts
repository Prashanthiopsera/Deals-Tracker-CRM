import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { RetrievalService } from './retrieval.service';

@Controller('ai/retrieve')
@UseGuards(JwtAuthGuard)
export class RetrievalController {
  constructor(private readonly retrieval: RetrievalService) {}

  @Get()
  @CedarAuthorize('read', 'Embedding')
  async query(
    @Query('q') query: string,
    @Query('topK') topK?: number,
    @Req() req?: Request & { user: AuthUserContext },
  ) {
    return this.retrieval.retrieve(
      query ?? '',
      req!.user.p7vcUserId,
      req!.user.p7vcRole,
      topK ? Number(topK) : 10,
    );
  }
}
