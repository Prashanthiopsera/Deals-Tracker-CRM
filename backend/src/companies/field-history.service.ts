import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

const OWNERSHIP_FIELDS = new Set(['deal_lead_id', 'deal_lead_support_1_id', 'deal_lead_support_2_id']);

export interface FieldHistoryEntry {
  actor_id: string;
  timestamp: string;
  old_value: unknown;
  new_value: unknown;
}

@Injectable()
export class FieldHistoryService {
  constructor(private readonly audit: AuditService) {}

  async getFieldHistory(
    companyId: string,
    fieldName: string,
    role: string,
    page = 1,
    pageSize = 50,
  ): Promise<{ items: FieldHistoryEntry[]; page: number; has_more: boolean }> {
    if (role === 'Intern' && OWNERSHIP_FIELDS.has(fieldName)) {
      throw new Error('Forbidden');
    }
    const events = await this.audit.queryAuditEvents({ resourceId: companyId, resourceType: 'Company' });
    const items = events
      .filter((event) => event.changedFields?.includes(fieldName))
      .map((event) => ({
        actor_id: String(event.actorId),
        timestamp: String(event.timestamp),
        old_value: event.beforeState?.[fieldName] ?? null,
        new_value: event.afterState?.[fieldName] ?? null,
      }))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return { items: pageItems, page, has_more: start + pageSize < items.length };
  }
}
