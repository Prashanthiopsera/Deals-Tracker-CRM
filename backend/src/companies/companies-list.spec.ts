import { DealStage } from '../database/enums';
import {
  applyCompanyFilters,
  decodeListCursor,
  encodeListCursor,
  paginateCompanyRows,
  parseTagFilter,
} from './companies-list';
import { buildCompanyListFixture } from '../../test-fixtures/companies/list-seed';

describe('companies list filtering and pagination (WO-048)', () => {
  const rows = buildCompanyListFixture(120);
  const toResponse = (row: (typeof rows)[number]) => ({ id: row.id, name: row.name, deal_stage: row.dealStage });

  it('filters by deal_stage', () => {
    const filtered = applyCompanyFilters(rows, { deal_stage: DealStage.SCREENING });
    expect(filtered.every((row) => row.dealStage === DealStage.SCREENING)).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('filters by sector and geography together', () => {
    const filtered = applyCompanyFilters(rows, { sector: 'fintech', geography: 'US' });
    expect(filtered.every((row) => row.sector === 'fintech' && row.geography === 'US')).toBe(true);
  });

  it('filters tags with any-match semantics', () => {
    expect(parseTagFilter('ai,saas')).toEqual(['ai', 'saas']);
    const filtered = applyCompanyFilters(rows, { tags: 'ai,saas' });
    expect(filtered.every((row) => row.tags.includes('ai') || row.tags.includes('saas'))).toBe(true);
  });

  it('filters by deal lead user id', () => {
    const filtered = applyCompanyFilters(rows, {
      deal_lead_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(filtered.every((row) => row.dealLeadId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(
      true,
    );
  });

  it('filters created date range', () => {
    const filtered = applyCompanyFilters(rows, {
      created_after: '2025-01-01',
      created_before: '2025-06-30',
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((row) => row.createdAt >= new Date('2025-01-01'))).toBe(true);
  });

  it('returns pagination metadata with cursor', () => {
    const first = paginateCompanyRows(rows, { limit: 10, sort_by: 'created_at', sort_order: 'DESC' }, toResponse);
    expect(first.items).toHaveLength(10);
    expect(first.total).toBe(120);
    expect(first.limit).toBe(10);
    expect(first.has_more).toBe(true);
    expect(first.cursor).toBeTruthy();

    const second = paginateCompanyRows(
      rows,
      { limit: 10, sort_by: 'created_at', sort_order: 'DESC', cursor: first.cursor ?? undefined },
      toResponse,
    );
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(decodeListCursor(first.cursor ?? undefined)?.id).toBeTruthy();
  });

  it('supports offset pagination fallback', () => {
    const page1 = paginateCompanyRows(rows, { page: 1, limit: 5 }, toResponse);
    const page2 = paginateCompanyRows(rows, { page: 2, limit: 5 }, toResponse);
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });
});
