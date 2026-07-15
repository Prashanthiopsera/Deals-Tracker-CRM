import { Body, Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { EmailDigestService } from './email-digest.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class DigestController {
  constructor(private readonly digest: EmailDigestService) {}

  @Patch(':id/digest-preferences')
  @CedarAuthorize('update', 'User')
  updatePreferences(
    @Param('id') userId: string,
    @Body() body: { frequency?: 'daily' | 'weekly' | 'disabled'; sections?: string[] },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    if (req.user.p7vcUserId !== userId && req.user.p7vcRole !== 'Admin') {
      throw new Error('Forbidden');
    }
    return this.digest.updatePreferences(userId, body);
  }
}
