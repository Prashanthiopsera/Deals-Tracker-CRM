import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

export interface ActivityRecord {
  id: string;
  company_id: string;
  user_id: string;
  activity_type: 'email' | 'meeting' | 'calendar_event' | 'note' | 'meeting_intelligence';
  source: 'gmail' | 'google_calendar' | 'granola' | 'zoom' | 'manual';
  subject?: string;
  body_preview?: string;
  participants: Record<string, unknown>[];
  occurred_at: string;
  raw_payload_s3_key?: string;
  metadata: Record<string, unknown>;
  external_id?: string;
}

@Injectable()
export class ActivityIngestionService {
  private readonly records = new Map<string, ActivityRecord>();
  private readonly dedupeKeys = new Set<string>();

  constructor(private readonly audit: AuditService) {}

  ingest(payload: Omit<ActivityRecord, 'id'>): ActivityRecord | null {
    const dedupeKey = `${payload.source}:${payload.external_id ?? payload.occurred_at}`;
    if (this.dedupeKeys.has(dedupeKey)) return null;
    this.dedupeKeys.add(dedupeKey);
    const record: ActivityRecord = { ...payload, id: randomUUID() };
    this.records.set(record.id, record);
    this.audit.publishAuditEvent({
      actorId: payload.user_id,
      actorRole: 'Director',
      operation: 'create',
      resourceType: 'Activity',
      resourceId: record.id,
      metadata: { action: 'activity.ingest', source: payload.source, company_id: payload.company_id },
    });
    return record;
  }

  listByCompany(companyId: string): ActivityRecord[] {
    return [...this.records.values()].filter((record) => record.company_id === companyId);
  }
}

@Injectable()
export class ActivityQueueConsumer {
  constructor(private readonly ingestion: ActivityIngestionService) {}

  consume(messages: Array<Omit<ActivityRecord, 'id'>>): ActivityRecord[] {
    return messages
      .map((message) => this.ingestion.ingest(message))
      .filter((record): record is ActivityRecord => record !== null);
  }
}
