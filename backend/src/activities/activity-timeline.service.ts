import { Injectable } from '@nestjs/common';
import { ActivityIngestionService, ActivityRecord } from './activity-ingestion.service';

export interface ActivityListQuery {
  activity_type?: string;
  source?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface ActivityListResponse {
  items: Array<Omit<ActivityRecord, 'raw_payload_s3_key'>>;
  cursor: string | null;
  has_more: boolean;
}

@Injectable()
export class ActivityTimelineService {
  constructor(private readonly ingestion: ActivityIngestionService) {}

  listByCompany(companyId: string, query: ActivityListQuery): ActivityListResponse {
    const limit = Math.min(Number(query.limit ?? 25), 100);
    const sortDesc = (query as ActivityListQuery & { sort?: string }).sort !== 'asc';
    let items = this.ingestion
      .listByCompany(companyId)
      .filter((record) => this.matchesFilters(record, query))
      .sort((a, b) => {
        const delta = Date.parse(b.occurred_at) - Date.parse(a.occurred_at);
        return sortDesc ? delta : -delta;
      });

    let startIndex = 0;
    if (query.cursor) {
      const cursorIndex = items.findIndex((item) => item.id === query.cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const page = items.slice(startIndex, startIndex + limit);
    const sanitized = page.map(({ raw_payload_s3_key, ...rest }) => rest);
    const hasMore = startIndex + limit < items.length;
    return {
      items: sanitized,
      cursor: hasMore ? page[page.length - 1]?.id ?? null : null,
      has_more: hasMore,
    };
  }

  computeLastTouch(companyId: string) {
    const latest = this.ingestion
      .listByCompany(companyId)
      .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))[0];
    if (!latest) return null;
    return { occurred_at: latest.occurred_at, activity_type: latest.activity_type };
  }

  computeNextStep(companyId: string) {
    const now = Date.now();
    const upcoming = this.ingestion
      .listByCompany(companyId)
      .filter(
        (record) =>
          ['meeting', 'calendar_event'].includes(record.activity_type) &&
          Date.parse(record.occurred_at) >= now,
      )
      .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))[0];
    if (!upcoming) return null;
    return { subject: upcoming.subject ?? 'Upcoming event', occurred_at: upcoming.occurred_at };
  }

  private matchesFilters(record: ActivityRecord, query: ActivityListQuery): boolean {
    if (query.activity_type && record.activity_type !== query.activity_type) return false;
    if (query.source && record.source !== query.source) return false;
    if (query.from && Date.parse(record.occurred_at) < Date.parse(query.from)) return false;
    if (query.to && Date.parse(record.occurred_at) > Date.parse(query.to)) return false;
    return true;
  }
}
