import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { AgentTaskService } from './agent-task.service';

@Controller('api/agent-tasks')
export class AgentTasksController {
  constructor(private readonly tasks: AgentTaskService) {}

  @Get()
  list(
    @Req() req: Request & { user?: AuthUserContext },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user?.p7vcUserId ?? 'director-1';
    return this.tasks.listTasks(userId, Number(page ?? 1), Number(limit ?? 20));
  }

  @Post(':id/approve')
  @CedarAuthorize('update', 'Company')
  approve(@Param('id') id: string, @Req() req: Request & { user: AuthUserContext }) {
    return this.tasks.approve(id, req.user.p7vcUserId, req.user.p7vcRole);
  }

  @Post(':id/reject')
  @CedarAuthorize('update', 'Company')
  reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.tasks.reject(id, req.user.p7vcUserId, req.user.p7vcRole, body.reason);
  }
}
