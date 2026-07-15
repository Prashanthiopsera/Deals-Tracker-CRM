import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface ContactRecord {
  id: string;
  company_id: string;
  full_name: string;
  email?: string;
  pii_classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

@Injectable()
export class ContactsService {
  private readonly contacts = new Map<string, ContactRecord>();

  constructor(private readonly audit: AuditService) {}

  create(input: Omit<ContactRecord, 'id'>): ContactRecord {
    const record = { ...input, id: randomUUID() };
    this.contacts.set(record.id, record);
    this.audit.publishAuditEvent({
      actorId: 'system',
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Contact',
      resourceId: record.id,
      metadata: { pii_classification: record.pii_classification },
    });
    return record;
  }

  listByCompany(companyId: string): ContactRecord[] {
    return [...this.contacts.values()].filter((c) => c.company_id === companyId);
  }
}
