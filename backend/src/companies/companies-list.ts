import { SelectQueryBuilder } from 'typeorm';
import { Company } from '../database/entities/company.entity';
import { CompanyStatus, DealStage } from '../database/enums';
import { ListCompaniesQueryDto } from './companies.dto';

export interface ListCursorPayload {
  id: string;
  sortValue: string;
}

export interface CompanyListRow {
  id: string;
  name: string;
  dealLeadId: string | null;
  support1Id: string | null;
  support2Id: string | null;
  dealStage: DealStage;
  status: CompanyStatus;
  sector: string | null;
  geography: string | null;
  tags: string[];
  notes: string | null;
  keyDates: Record<string, string>;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CompanyListResult {
  items: Record<string, unknown>[];
  total: number;
  limit: number;
  cursor: string | null;
  has_more: boolean;
}

const SORT_COLUMNS: Record<string, keyof CompanyListRow | 'createdAt' | 'updatedAt' | 'name'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  deal_stage: 'dealStage',
  sector: 'sector',
};

export function parseTagFilter(tags?: string): string[] {
  if (!tags?.trim()) return [];
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function encodeListCursor(payload: ListCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeListCursor(cursor?: string): ListCursorPayload | null {
  if (!cursor?.trim()) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as ListCursorPayload;
    if (typeof parsed.id === 'string' && typeof parsed.sortValue === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveSortField(sortBy?: string): keyof CompanyListRow {
  return (SORT_COLUMNS[sortBy ?? 'created_at'] ?? 'createdAt') as keyof CompanyListRow;
}

export function applyCompanyFilters<T extends CompanyListRow>(
  rows: T[],
  query: ListCompaniesQueryDto,
): T[] {
  let filtered = rows.filter((row) => !row.deletedAt);
  if (query.deal_stage) filtered = filtered.filter((row) => row.dealStage === query.deal_stage);
  if (query.status) filtered = filtered.filter((row) => row.status === query.status);
  if (query.sector) filtered = filtered.filter((row) => row.sector === query.sector);
  if (query.geography) filtered = filtered.filter((row) => row.geography === query.geography);
  if (query.deal_lead_user_id) {
    filtered = filtered.filter((row) => row.dealLeadId === query.deal_lead_user_id);
  }
  const tagFilters = parseTagFilter(query.tags);
  if (tagFilters.length) {
    filtered = filtered.filter((row) => tagFilters.some((tag) => row.tags.includes(tag)));
  }
  if (query.created_after) {
    const after = new Date(query.created_after);
    filtered = filtered.filter((row) => row.createdAt >= after);
  }
  if (query.created_before) {
    const before = new Date(query.created_before);
    filtered = filtered.filter((row) => row.createdAt <= before);
  }
  if (query.updated_after) {
    const after = new Date(query.updated_after);
    filtered = filtered.filter((row) => row.updatedAt >= after);
  }
  if (query.updated_before) {
    const before = new Date(query.updated_before);
    filtered = filtered.filter((row) => row.updatedAt <= before);
  }
  return filtered;
}

function compareRows(
  a: CompanyListRow,
  b: CompanyListRow,
  sortField: keyof CompanyListRow,
  sortOrder: 'ASC' | 'DESC',
): number {
  const av = a[sortField];
  const bv = b[sortField];
  let result = 0;
  if (av instanceof Date && bv instanceof Date) {
    result = av.getTime() - bv.getTime();
  } else {
    result = String(av ?? '').localeCompare(String(bv ?? ''));
  }
  if (result === 0) {
    result = a.id.localeCompare(b.id);
  }
  return sortOrder === 'ASC' ? result : -result;
}

export function sortCompanyRows(
  rows: CompanyListRow[],
  query: ListCompaniesQueryDto,
): CompanyListRow[] {
  const sortField = resolveSortField(query.sort_by);
  const sortOrder = query.sort_order ?? 'DESC';
  return [...rows].sort((a, b) => compareRows(a, b, sortField, sortOrder));
}

export function paginateCompanyRows(
  rows: CompanyListRow[],
  query: ListCompaniesQueryDto,
  toResponse: (row: CompanyListRow) => Record<string, unknown>,
): CompanyListResult {
  const limit = Math.min(Number(query.limit ?? 20), 100);
  const sortField = resolveSortField(query.sort_by);
  const sortOrder = query.sort_order ?? 'DESC';
  const sorted = sortCompanyRows(rows, query);
  let startIndex = 0;

  if (query.cursor) {
    const decoded = decodeListCursor(query.cursor);
    if (decoded) {
      startIndex = sorted.findIndex((row) => row.id === decoded.id) + 1;
      if (startIndex < 1) startIndex = 0;
    }
  } else if (query.page) {
    startIndex = (Number(query.page) - 1) * limit;
  }

  const pageRows = sorted.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < sorted.length;
  const last = pageRows[pageRows.length - 1];
  const cursor =
    hasMore && last
      ? encodeListCursor({
          id: last.id,
          sortValue:
            last[sortField] instanceof Date
              ? (last[sortField] as Date).toISOString()
              : String(last[sortField] ?? ''),
        })
      : null;

  return {
    items: pageRows.map((row) => toResponse(row)),
    total: sorted.length,
    limit,
    cursor,
    has_more: hasMore,
  };
}

export function applyTypeOrmCompanyFilters(
  qb: SelectQueryBuilder<Company>,
  query: ListCompaniesQueryDto,
): SelectQueryBuilder<Company> {
  qb.where('c.deletedAt IS NULL');
  if (query.deal_stage) qb.andWhere('c.dealStage = :dealStage', { dealStage: query.deal_stage });
  if (query.status) qb.andWhere('c.status = :status', { status: query.status });
  if (query.sector) qb.andWhere('c.sector = :sector', { sector: query.sector });
  if (query.geography) qb.andWhere('c.geography = :geography', { geography: query.geography });
  if (query.deal_lead_user_id) {
    qb.andWhere('c.dealLeadId = :dealLeadUserId', { dealLeadUserId: query.deal_lead_user_id });
  }
  const tagFilters = parseTagFilter(query.tags);
  if (tagFilters.length) {
    qb.andWhere('c.tags && ARRAY[:...tagFilters]', { tagFilters });
  }
  if (query.created_after) {
    qb.andWhere('c.createdAt >= :createdAfter', { createdAfter: new Date(query.created_after) });
  }
  if (query.created_before) {
    qb.andWhere('c.createdAt <= :createdBefore', { createdBefore: new Date(query.created_before) });
  }
  if (query.updated_after) {
    qb.andWhere('c.updatedAt >= :updatedAfter', { updatedAfter: new Date(query.updated_after) });
  }
  if (query.updated_before) {
    qb.andWhere('c.updatedAt <= :updatedBefore', { updatedBefore: new Date(query.updated_before) });
  }
  return qb;
}

export function applyTypeOrmCompanySort(
  qb: SelectQueryBuilder<Company>,
  query: ListCompaniesQueryDto,
): SelectQueryBuilder<Company> {
  const sortColumn =
    query.sort_by === 'updated_at'
      ? 'c.updatedAt'
      : query.sort_by === 'name'
        ? 'c.name'
        : query.sort_by === 'deal_stage'
          ? 'c.dealStage'
          : query.sort_by === 'sector'
            ? 'c.sector'
            : 'c.createdAt';
  qb.orderBy(sortColumn, query.sort_order ?? 'DESC').addOrderBy('c.id', query.sort_order ?? 'DESC');
  return qb;
}
