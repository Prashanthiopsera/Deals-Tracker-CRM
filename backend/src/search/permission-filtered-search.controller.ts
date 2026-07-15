import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { PermissionFilteredSearchService } from './permission-filtered-search.service';

@Controller('search/filtered')
@UseGuards(JwtAuthGuard)
export class PermissionFilteredSearchController {
  constructor(private readonly filteredSearch: PermissionFilteredSearchService) {}

  @Get()
  @CedarAuthorize('read', 'Search')
  query(
    @Query('q') query: string,
    @Query('mode') mode: 'full_text' | 'semantic',
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.filteredSearch.search(query ?? '', req.user.p7vcRole, mode ?? 'full_text');
  }
}
