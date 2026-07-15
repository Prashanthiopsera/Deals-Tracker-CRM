import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { AutomationEngineService, AutomationRulesService } from './automation.service';

@Controller('automation-rules')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(
    private readonly rules: AutomationRulesService,
    private readonly engine: AutomationEngineService,
  ) {}

  @Get()
  @CedarAuthorize('read', 'Company')
  list() {
    return this.rules.list();
  }

  @Post()
  @CedarAuthorize('create', 'Company')
  create(@Body() body: { from_stage: string; to_stage: string; actions: string[] }) {
    return this.rules.create(body);
  }

  @Delete(':id')
  @CedarAuthorize('delete', 'Company')
  remove(@Param('id') id: string) {
    return { deleted: this.rules.delete(id) };
  }

  @Post('simulate/stage-transition')
  @CedarAuthorize('update', 'Company')
  simulate(@Body() body: { company_id: string; from_stage: string; to_stage: string; actor_id: string }) {
    this.engine.onStageTransition({
      companyId: body.company_id,
      fromStage: body.from_stage,
      toStage: body.to_stage,
      actorId: body.actor_id,
    });
    return { executed: this.engine.getExecutedActions() };
  }
}
