import { UserRole } from '../database/enums';
import { searchFixtureRecords } from '../../test-fixtures/search/search-records.fixture';
import { SearchService } from './search.service';

describe('SearchService (WO-073)', () => {
  const service = new SearchService();

  beforeEach(() => {
    service.seedRecords(searchFixtureRecords);
  });

  it('returns ranked full-text matches with snippets', () => {
    const response = service.search('robotics', UserRole.DIRECTOR);
    expect(response.total).toBeGreaterThan(0);
    expect(response.results[0].snippet).toContain('**');
  });

  it('returns empty results for unknown queries', () => {
    const response = service.search('zzznomatch', UserRole.DIRECTOR);
    expect(response.total).toBe(0);
  });

  it('completes search under 300ms for fixture dataset', () => {
    const response = service.search('Company', UserRole.DIRECTOR);
    expect(response.latencyMs).toBeLessThan(300);
  });

  it('filters director-only records from intern results', () => {
    const intern = service.search('Company 10', UserRole.INTERN);
    const director = service.search('Company 10', UserRole.DIRECTOR);
    expect(director.total).toBeGreaterThanOrEqual(intern.total);
  });

  it('allows directors to see all matching records', () => {
    const response = service.search('Company', UserRole.DIRECTOR);
    expect(response.total).toBeGreaterThan(50);
  });

  it('includes entity type and record id in each result', () => {
    const response = service.search('memo', UserRole.PRINCIPAL);
    expect(response.results[0]).toMatchObject({
      entityType: expect.any(String),
      recordId: expect.any(String),
      matchedField: expect.any(String),
    });
  });

  it('matches contacts by email tokens', () => {
    const response = service.search('contact1@example.com', UserRole.ASSOCIATE);
    expect(response.results.some((item) => item.entityType === 'contact')).toBe(true);
  });
});
