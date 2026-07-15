import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ErasureService } from './erasure.service';

@Controller('erasure')
@UseGuards(JwtAuthGuard)
export class ErasureController {
  constructor(private readonly erasure: ErasureService) {}

  private actor(req: Request & { user: AuthUserContext }) {
    if (req.user.p7vcRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return { id: req.user.p7vcUserId, role: req.user.p7vcRole };
  }

  @Post()
  @CedarAuthorize('delete', 'ErasureRequest')
  create(
    @Body() body: { subjectIdentifier: string; contactDekArn?: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.erasure.createRequest(
      body.subjectIdentifier,
      actor.id,
      actor.role,
      { contactDekArn: body.contactDekArn },
    );
  }
}
