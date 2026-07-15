import { SavedSearchService } from './saved-search.service';

describe('SavedSearchService (WO-076)', () => {
  let service: SavedSearchService;

  beforeEach(() => {
    service = new SavedSearchService();
  });

  it('creates and lists saved searches for an owner', () => {
    service.create('Robotics deals', 'robotics', 'full_text', 'user-1');
    expect(service.list('user-1')).toHaveLength(1);
  });

  it('removes saved searches owned by the user', () => {
    const saved = service.create('Contacts', 'ada@example.com', 'semantic', 'user-1');
    service.remove(saved.id, 'user-1');
    expect(service.list('user-1')).toHaveLength(0);
  });
});
