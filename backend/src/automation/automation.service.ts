import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface AutomationRule {
  id: string;
  from_stage: string;
  to_stage: string;
  actions: string[];
}

@Injectable()
export class AutomationRulesService {
  private readonly rules = new Map<string, AutomationRule>();

  create(input: Omit<AutomationRule, 'id'>): AutomationRule {
    const rule: AutomationRule = { ...input, id: randomUUID() };
    this.rules.set(rule.id, rule);
    return rule;
  }

  list(): AutomationRule[] {
    return [...this.rules.values()];
  }

  delete(id: string): boolean {
    return this.rules.delete(id);
  }

  match(fromStage: string, toStage: string): AutomationRule[] {
    return this.list().filter(
      (rule) =>
        (rule.from_stage === fromStage || rule.from_stage === '*') &&
        (rule.to_stage === toStage || rule.to_stage === '*'),
    );
  }
}

@Injectable()
export class AutomationEngineService {
  private readonly executed: Array<{ rule_id: string; action: string }> = [];

  constructor(
    private readonly rules: AutomationRulesService,
    private readonly audit: AuditService,
  ) {}

  onStageTransition(event: {
    companyId: string;
    fromStage: string;
    toStage: string;
    actorId: string;
  }): void {
    const matched = this.rules.match(event.fromStage, event.toStage);
    for (const rule of matched) {
      for (const action of rule.actions) {
        this.executed.push({ rule_id: rule.id, action });
        this.audit.publishAuditEvent({
          actorId: event.actorId,
          actorRole: 'Director',
          operation: 'stage_transition',
          resourceType: 'AutomationRule',
          resourceId: rule.id,
          metadata: { action, company_id: event.companyId },
        });
      }
    }
  }

  detectStaleDeals(lastActivityDays: number, threshold = 14): string[] {
    return lastActivityDays >= threshold ? ['company-stale-1'] : [];
  }

  getExecutedActions() {
    return [...this.executed];
  }
}
