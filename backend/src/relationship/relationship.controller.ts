import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { CoInvestorService } from './co-investor.service';
import { RelationshipScoringService } from './relationship-scoring.service';
import { WarmIntroPathService } from './warm-intro-path.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RelationshipController {
  constructor(
    private readonly scoring: RelationshipScoringService,
    private readonly paths: WarmIntroPathService,
    private readonly coInvestors: CoInvestorService,
  ) {}

  @Get('relationship-scores')
  @CedarAuthorize('read', 'Company')
  scores(@Query('contact_id') contactId: string) {
    return this.scoring.listByContact(contactId);
  }

  @Post('relationship-scores/compute')
  @CedarAuthorize('create', 'Company')
  compute(@Body() body: { pairs: Parameters<RelationshipScoringService['computeBatch']>[1] }) {
    return this.scoring.computeBatch('admin', body.pairs);
  }

  @Get('relationship-paths')
  @CedarAuthorize('read', 'Company')
  introPaths(@Query('target_contact_id') targetContactId: string, @Query('graph') _graphJson?: string) {
    return this.paths.findPaths(targetContactId, {});
  }

  @Get('companies/:id/co-investors')
  @CedarAuthorize('read', 'Company')
  companyCoInvestors(@Param('id') companyId: string) {
    return this.coInvestors.listByCompany(companyId);
  }

  @Get('co-investor-graph')
  @CedarAuthorize('read', 'Company')
  coInvestorGraph(@Query('investor_name') investorName: string) {
    return this.coInvestors.graphByInvestor(investorName);
  }
}
