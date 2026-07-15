import {
  GoogleDriveConnectorAdapter,
  normalizeGoogleDriveFile,
  normalizeNotionPage,
} from './document-connectors.adapter';
import {
  googleDriveFileFixture,
  notionPageFixture,
} from '../../../test-fixtures/connectors/document-connectors.fixture';

describe('DocumentConnectors (WO-100)', () => {
  it('normalizes Google Drive metadata', () => {
    const doc = normalizeGoogleDriveFile(googleDriveFileFixture, 'company-1');
    expect(doc.source).toBe('google_drive');
    expect(doc.linked_company_id).toBe('company-1');
  });

  it('normalizes Notion page metadata', () => {
    const doc = normalizeNotionPage(notionPageFixture);
    expect(doc.source).toBe('notion');
  });

  it('lists drive documents via adapter', async () => {
    const adapter = new GoogleDriveConnectorAdapter();
    const result = await adapter.execute({ company_id: 'company-1' });
    expect(result.documents).toHaveLength(1);
  });
});
