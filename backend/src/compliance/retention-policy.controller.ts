import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { RetentionPolicyService } from './retention-policy.service';
import { RetentionDataCategory } from '../../test-fixtures/compliance/retention.fixture';

@Controller('retention-policies')
@UseGuards(JwtAuthGuard)
export class RetentionPolicyController {
  constructor(private readonly retention: RetentionPolicyService) {}

  private actor(req: Request & { user: AuthUserContext }) {
    if (req.user.p7vcRole !== 'Admin') {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return { id: req.user.p7vcUserId, role: req.user.p7vcRole };
  }

  @Get()
  @CedarAuthorize('read', 'RetentionPolicy')
  list(@Req() req: Request & { user: AuthUserContext }) {
    return this.retention.list(this.actor(req).role);
  }

  @Get(':id')
  @CedarAuthorize('read', 'RetentionPolicy')
  get(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.retention.get(id, this.actor(req).role);
  }

  @Post()
  @CedarAuthorize('create', 'RetentionPolicy')
  create(
    @Body()
    body: {
      dataCategory: RetentionDataCategory;
      retentionPeriodDays: number;
      actionOnExpiry: 'delete' | 'anonymize' | 'archive';
      cronExpression: string;
      batchSize: number;
    },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.retention.create(body, actor.id, actor.role);
  }

  @Patch(':id')
  @CedarAuthorize('update', 'RetentionPolicy')
  update(
    @Param('id') id: string,
    @Body() body: { retentionPeriodDays?: number; actionOnExpiry?: 'delete' | 'anonymize' | 'archive' },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.retention.update(id, body, actor.id, actor.role);
  }

  @Post(':category/purge')
  @CedarAuthorize('delete', 'RetentionPolicy')
  purge(
    @Param('category') category: RetentionDataCategory,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    const actor = this.actor(req);
    return this.retention.runPurge(category, actor.id, actor.role);
  }
}
