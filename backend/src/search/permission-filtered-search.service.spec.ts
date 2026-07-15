import { UserRole } from '../database/enums';
import { PermissionFilteredSearchService } from './permission-filtered-search.service';
import { SearchService } from './search.service';
import { SemanticSearchService } from './semantic-search.service';

describe('PermissionFilteredSearchService (WO-075)', () => {
  const service = new PermissionFilteredSearchService(new SearchService(), new SemanticSearchService());

  it('returns permission-filtered full-text results', () => {
    const intern = service.search('Company 10', UserRole.INTERN);
    const director = service.search('Company 10', UserRole.DIRECTOR);
    expect(director.total).toBeGreaterThanOrEqual(intern.total ?? 0);
  });

  it('returns semantic results for authorized roles', () => {
    const response = service.search('robotics automation', UserRole.DIRECTOR, 'semantic');
    expect(response.mode).toBe('semantic');
    expect(response.total).toBeGreaterThan(0);
  });
});
