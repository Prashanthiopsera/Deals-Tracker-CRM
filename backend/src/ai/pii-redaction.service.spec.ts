import { createAuditTestStack } from '../audit/audit-test.utils';
import { PiiClassification, UserRole } from '../database/enums';
import { PiiRegistryService } from '../pii/pii-registry.service';
import { mockRagRetrievalPayload } from '../../test-fixtures/ai/rag-contact.fixture';
import { registerPiiEntity } from '../pii/pii-classification.metadata';
import { PiiRedactionService, REDACTED_VALUE } from './pii-redaction.service';

describe('PiiRedactionService (WO-068)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const piiRegistry = new PiiRegistryService();
  const service = new PiiRedactionService(piiRegistry, audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
    piiRegistry.onModuleInit();
  });

  it('masks confidential contact PII for Intern role users', () => {
    const result = service.redactRagPayload(
      mockRagRetrievalPayload as never,
      'intern-1',
      UserRole.INTERN,
    );

    expect(result.records[0].email).toBe(REDACTED_VALUE);
    expect(result.records[0].firstName).toBe(REDACTED_VALUE);
    expect(result.narrative).toContain(REDACTED_VALUE);
    expect(result.redactionLatencyMs).toBeLessThan(50);
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'ai.pii_redaction')).toBe(
      true,
    );
  });

  it('allows confidential PII for Director and Principal roles', () => {
    for (const role of [UserRole.DIRECTOR, UserRole.PRINCIPAL]) {
      const result = service.redactRagPayload(
        mockRagRetrievalPayload as never,
        'user-1',
        role,
      );
      expect(result.records[0].email).toBe('ada@example.com');
      expect(result.records[0].firstName).toBe('Ada');
    }
  });

  it('masks restricted PII for all non-admin roles', () => {
    registerPiiEntity('ContactRestricted', {
      email: PiiClassification.RESTRICTED,
      phone: PiiClassification.RESTRICTED,
    });
    const payload = {
      entityType: 'ContactRestricted',
      records: [{ email: 'grace@example.com', phone: '+1-555-0200' }],
      narrative: 'Restricted contact grace@example.com',
    };

    for (const role of [UserRole.DIRECTOR, UserRole.PRINCIPAL, UserRole.INTERN]) {
      const result = service.redactRagPayload(payload, 'user-1', role);
      expect(result.records[0].email).toBe(REDACTED_VALUE);
      expect(result.records[0].phone).toBe(REDACTED_VALUE);
    }
  });

  it('evaluates field-level redaction decisions', () => {
    expect(service.shouldRedactField(UserRole.INTERN, PiiClassification.CONFIDENTIAL)).toBe(true);
    expect(service.shouldRedactField(UserRole.DIRECTOR, PiiClassification.CONFIDENTIAL)).toBe(
      false,
    );
    expect(service.shouldRedactField(UserRole.DIRECTOR, PiiClassification.RESTRICTED)).toBe(true);
    expect(service.shouldRedactField(UserRole.ADMIN, PiiClassification.RESTRICTED)).toBe(false);
  });
});
