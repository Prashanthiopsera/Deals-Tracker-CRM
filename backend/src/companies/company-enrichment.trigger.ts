import { Injectable } from '@nestjs/common';
import { EnrichmentAgentService } from '../agent/enrichment/enrichment-agent.service';

@Injectable()
export class CompanyEnrichmentTrigger {
  constructor(private readonly enrichment: EnrichmentAgentService) {}

  async onCompanyCreated(input: {
    companyId: string;
    companyName: string;
    actorId: string;
    actorRole: string;
    userEnteredFields?: Record<string, unknown>;
  }) {
    return this.enrichment.triggerOnCompanyCreate(input);
  }
}
