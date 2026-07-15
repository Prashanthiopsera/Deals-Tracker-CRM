import { createAuditTestStack } from '../audit/audit-test.utils';
import { FieldHistoryService } from './field-history.service';

describe('FieldHistoryService (WO-114)', () => {
  const { service: audit } = createAuditTestStack();
  const history = new FieldHistoryService(audit);

  beforeEach(async () => {
    await audit.processAuditEvent({
      eventId: 'evt-1',
      timestamp: new Date().toISOString(),
      actorId: 'director-1',
      actorRole: 'Director',
      operation: 'update',
      resourceType: 'Company',
      resourceId: 'company-1',
      beforeState: { deal_stage: 'SOURCED' },
      afterState: { deal_stage: 'SCREENING' },
      affectedFields: ['deal_stage'],
      correlationId: 'corr-1',
    });
  });

  it('returns paginated field history from audit log', async () => {
    const result = await history.getFieldHistory('company-1', 'deal_stage', 'Director');
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('blocks intern access to ownership field history', async () => {
    await expect(history.getFieldHistory('company-1', 'deal_lead_id', 'Intern')).rejects.toThrow(
      'Forbidden',
    );
  });
});
