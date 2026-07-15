import { createAuditTestStack } from '../audit/audit-test.utils';
import { automationRuleFixtures } from '../../test-fixtures/automation/automation.fixture';
import { AutomationEngineService, AutomationRulesService } from './automation.service';

describe('Automation engine (WO-119)', () => {
  const { service: audit } = createAuditTestStack();
  const rules = new AutomationRulesService();
  const engine = new AutomationEngineService(rules, audit);

  it('executes rules on stage transition', () => {
    rules.create(automationRuleFixtures[0]);
    engine.onStageTransition({
      companyId: 'c1',
      fromStage: 'SCREENING',
      toStage: 'DILIGENCE',
      actorId: 'director-1',
    });
    expect(engine.getExecutedActions()).toHaveLength(2);
  });

  it('detects stale deals', () => {
    expect(engine.detectStaleDeals(20)).toContain('company-stale-1');
  });
});
