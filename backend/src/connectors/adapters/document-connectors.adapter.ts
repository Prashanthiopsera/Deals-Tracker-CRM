import { ConnectorHealthResult, IConnectorAdapter } from '../connector.types';
import {
  googleDriveFileFixture,
  notionPageFixture,
} from '../../../test-fixtures/connectors/document-connectors.fixture';

export interface DocumentReference {
  external_id: string;
  title: string;
  url: string;
  mime_type: string;
  size: number;
  last_modified: string;
  source: 'google_drive' | 'notion';
  linked_company_id?: string;
}

export function normalizeGoogleDriveFile(
  file: typeof googleDriveFileFixture,
  companyId?: string,
): DocumentReference {
  return {
    external_id: file.id,
    title: file.name,
    url: file.webViewLink,
    mime_type: file.mimeType,
    size: Number(file.size),
    last_modified: file.modifiedTime,
    source: 'google_drive',
    linked_company_id: companyId,
  };
}

export function normalizeNotionPage(
  page: typeof notionPageFixture,
  companyId?: string,
): DocumentReference {
  return {
    external_id: page.id,
    title: page.title,
    url: page.url,
    mime_type: 'text/html',
    size: 0,
    last_modified: page.last_edited_time,
    source: 'notion',
    linked_company_id: companyId,
  };
}

export class GoogleDriveConnectorAdapter implements IConnectorAdapter {
  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      documents: [normalizeGoogleDriveFile(googleDriveFileFixture, input.company_id as string)],
    };
  }
  async shutdown(): Promise<void> {}
}

export class NotionConnectorAdapter implements IConnectorAdapter {
  async initialize(): Promise<void> {}
  async healthCheck(): Promise<ConnectorHealthResult> {
    return { healthy: true };
  }
  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      documents: [normalizeNotionPage(notionPageFixture, input.company_id as string)],
    };
  }
  async shutdown(): Promise<void> {}
}
