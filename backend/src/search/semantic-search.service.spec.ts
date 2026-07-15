import { SemanticSearchService } from './semantic-search.service';

describe('SemanticSearchService (WO-074)', () => {
  const service = new SemanticSearchService();

  it('returns chunks ranked by cosine similarity', () => {
    const embedding = service.embedQuery('robotics automation');
    const results = service.search(embedding);
    expect(results[0].entityType).toBe('company');
    expect(results[0].score).toBeGreaterThan(results[1]?.score ?? 0);
  });

  it('embeds query text into vectors', () => {
    expect(service.embedQuery('robot startup')).toEqual([0.88, 0.12, 0.0]);
  });

  it('returns empty results for orthogonal queries', () => {
    const results = service.search([0, 0, 0]);
    expect(results).toEqual([]);
  });
});
