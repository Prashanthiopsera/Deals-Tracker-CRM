import { createAuditTestStack } from '../audit/audit-test.utils';
import { digestPreferenceFixtures } from '../../test-fixtures/digest/digest.fixture';
import { EmailDigestService } from './email-digest.service';

describe('EmailDigestService (WO-118)', () => {
  const { service: audit } = createAuditTestStack();
  const digest = new EmailDigestService(audit);

  it('updates digest preferences', () => {
    const prefs = digest.updatePreferences(digestPreferenceFixtures.user_id, {
      frequency: 'daily',
      sections: digestPreferenceFixtures.sections,
    });
    expect(prefs.frequency).toBe('daily');
  });

  it('sends role-scoped digests on schedule', () => {
    digest.updatePreferences('intern-1', { frequency: 'daily', sections: ['new_companies'] });
    digest.sendScheduledDigests('Intern');
    expect(digest.getSentDigests()[0].record_count).toBe(2);
  });
});
