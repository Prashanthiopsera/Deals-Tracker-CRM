import { createAuditTestStack } from '../audit/audit-test.utils';
import { DlpFilterService } from './dlp-filter.service';
import { dlpViolationPayloadFixture } from '../../test-fixtures/connectors/dlp.fixture';

describe('DlpFilterService (WO-101)', () => {
  const { queue, service: audit } = createAuditTestStack();
  const dlp = new DlpFilterService(audit);

  beforeEach(() => {
    queue.domainMessages.length = 0;
  });

  it('redacts PII patterns from outbound payloads', () => {
    const result = dlp.scanEgress('slack', { notes: 'Email secret@example.com' });
    expect(result.findings).toContain('email');
    expect(result.action).toBe('redact');
  });

  it('blocks ownership field egress', () => {
    const result = dlp.scanEgress('zoominfo', dlpViolationPayloadFixture);
    expect(result.findings).toContain('ownership_field');
    expect(result.allowed).toBe(false);
  });

  it('audits every DLP scan event', () => {
    dlp.scanEgress('gmail', { body: 'hello' });
    expect(queue.domainMessages.some((event) => event.metadata?.action === 'dlp.scan')).toBe(true);
  });
});
