import { createAuditTestStack } from '../audit/audit-test.utils';
import { documentUploadFixtures } from '../../test-fixtures/documents/documents.fixture';
import { DocumentsService } from './documents.service';

describe('DocumentsService (WO-115)', () => {
  const { service: audit } = createAuditTestStack();
  const documents = new DocumentsService(audit);

  it('uploads valid documents with kms metadata', () => {
    const record = documents.upload({
      ...documentUploadFixtures.validPdf,
      uploaded_by: 'director-1',
    });
    expect(record.kms_key_id).toContain('p7vc');
  });

  it('rejects oversized uploads', () => {
    expect(() =>
      documents.upload({
        ...documentUploadFixtures.oversized,
        company_id: '11111111-1111-1111-1111-111111111111',
        uploaded_by: 'director-1',
      }),
    ).toThrow('Payload too large');
  });

  it('returns presigned download urls', () => {
    const record = documents.upload({
      ...documentUploadFixtures.validPdf,
      uploaded_by: 'director-1',
    });
    const url = documents.getDownloadUrl(record.id, 'director-1');
    expect(url.expires_in_seconds).toBe(900);
  });
});
