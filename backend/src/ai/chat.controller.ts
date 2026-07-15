import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ChatService } from './chat.service';

@Controller('ai/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @CedarAuthorize('read', 'AiChat')
  ask(@Body() body: { message: string }, @Req() req: Request & { user: AuthUserContext }) {
    return this.chat.chat(body.message, req.user.p7vcUserId, req.user.p7vcRole);
  }
}
