import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { SavedSearchService } from './saved-search.service';

@Controller('search/saved')
@UseGuards(JwtAuthGuard)
export class SavedSearchController {
  constructor(private readonly savedSearch: SavedSearchService) {}

  @Get()
  @CedarAuthorize('read', 'Search')
  list(@Req() req: Request & { user: AuthUserContext }) {
    return this.savedSearch.list(req.user.p7vcUserId);
  }

  @Post()
  @CedarAuthorize('create', 'Search')
  create(
    @Body() body: { name: string; query: string; mode?: 'full_text' | 'semantic' },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.savedSearch.create(
      body.name,
      body.query,
      body.mode ?? 'full_text',
      req.user.p7vcUserId,
    );
  }

  @Delete(':id')
  @CedarAuthorize('delete', 'Search')
  remove(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.savedSearch.remove(id, req.user.p7vcUserId);
  }
}
