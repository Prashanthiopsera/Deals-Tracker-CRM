import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { CommentsService } from './comments.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get(':id/comments')
  @CedarAuthorize('read', 'Company')
  list(@Param('id') companyId: string) {
    return this.comments.listByCompany(companyId);
  }

  @Post(':id/comments')
  @CedarAuthorize('update', 'Company')
  create(
    @Param('id') companyId: string,
    @Body() body: { text: string; parent_comment_id?: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.comments.create({
      company_id: companyId,
      user_id: req.user.p7vcUserId,
      body: body.text,
      parent_comment_id: body.parent_comment_id ?? null,
    });
  }

  @Patch('comments/:commentId')
  @CedarAuthorize('update', 'Company')
  edit(
    @Param('commentId') commentId: string,
    @Body() body: { text: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.comments.edit(commentId, req.user.p7vcUserId, body.text);
  }
}
