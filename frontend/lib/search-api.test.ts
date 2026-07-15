import { createSavedSearch, listSavedSearches, searchRecords } from './search-api';

describe('search-api (WO-077)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('calls full-text search endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ query: 'robotics', results: [], total: 0 }),
    });
    const result = await searchRecords('robotics', 'token');
    expect(result.query).toBe('robotics');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?'),
      expect.any(Object),
    );
  });

  it('creates saved searches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', name: 'Deals' }),
    });
    const saved = await createSavedSearch('Deals', 'robotics', 'token');
    expect(saved.name).toBe('Deals');
  });

  it('lists saved searches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1', name: 'Deals' }],
    });
    const saved = await listSavedSearches('token');
    expect(saved).toHaveLength(1);
  });
});
