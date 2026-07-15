import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @CedarAuthorize('read', 'Search')
  query(@Query('q') query: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.searchService.search(query ?? '', req.user.p7vcRole);
  }
}
