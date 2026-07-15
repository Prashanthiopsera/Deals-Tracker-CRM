import { createAuditTestStack } from '../audit/audit-test.utils';
import { ContactsService } from './contacts.service';

describe('ContactsService (WO-065)', () => {
  const { service: audit } = createAuditTestStack();
  const contacts = new ContactsService(audit);

  it('creates contacts with PII classification tags', () => {
    const record = contacts.create({
      company_id: 'c1',
      full_name: 'Jane Doe',
      pii_classification: 'confidential',
    });
    expect(record.pii_classification).toBe('confidential');
  });
});
