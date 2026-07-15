import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

export interface DocumentRecord {
  id: string;
  company_id: string;
  filename: string;
  mime_type: string;
  s3_key: string;
  kms_key_id: string;
  uploaded_by: string;
  created_at: string;
}

@Injectable()
export class DocumentsService {
  private readonly records = new Map<string, DocumentRecord>();

  constructor(private readonly audit: AuditService) {}

  upload(input: {
    company_id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    uploaded_by: string;
  }): DocumentRecord {
    if (input.size_bytes > MAX_BYTES) {
      throw new Error('Payload too large');
    }
    if (!ALLOWED_MIME.has(input.mime_type)) {
      throw new Error('Unsupported mime type');
    }
    const record: DocumentRecord = {
      id: randomUUID(),
      company_id: input.company_id,
      filename: input.filename,
      mime_type: input.mime_type,
      s3_key: `companies/${input.company_id}/${input.filename}`,
      kms_key_id: 'alias/p7vc-documents',
      uploaded_by: input.uploaded_by,
      created_at: new Date().toISOString(),
    };
    this.records.set(record.id, record);
    this.audit.publishAuditEvent({
      actorId: input.uploaded_by,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Document',
      resourceId: record.id,
      metadata: { action: 'document.upload', company_id: input.company_id, filename: input.filename },
    });
    return record;
  }

  listByCompany(companyId: string): DocumentRecord[] {
    return [...this.records.values()].filter((record) => record.company_id === companyId);
  }

  getDownloadUrl(documentId: string, actorId: string): { url: string; expires_in_seconds: number } {
    const record = this.records.get(documentId);
    if (!record) throw new Error('Not found');
    this.audit.publishAuditEvent({
      actorId,
      actorRole: 'Director',
      operation: 'update',
      resourceType: 'Document',
      resourceId: documentId,
      metadata: { action: 'document.download', company_id: record.company_id },
    });
    return {
      url: `https://s3.amazonaws.com/p7vc-documents/${record.s3_key}?X-Amz-Expires=900`,
      expires_in_seconds: 900,
    };
  }
}
