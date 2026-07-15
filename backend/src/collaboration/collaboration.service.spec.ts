import { SharedViewsService } from './shared-views.service';
import { PresenceService } from './presence.service';
import { sharedViewFixtures } from '../../test-fixtures/collaboration/shared-views.fixture';

describe('Collaboration services (WO-113)', () => {
  it('filters shared views for intern role', () => {
    const views = new SharedViewsService();
    views.create({ ...sharedViewFixtures[0], visibility: 'role-based' });
    expect(views.listForUser('intern-1', 'Intern')).toHaveLength(0);
    expect(views.listForUser('director-1', 'Director')).toHaveLength(1);
  });

  it('tracks presence heartbeats', () => {
    const presence = new PresenceService();
    presence.heartbeat('u1', 'c1');
    expect(presence.listViewers('c1')).toContain('u1');
    presence.leave('u1', 'c1');
    expect(presence.listViewers('c1')).toHaveLength(0);
  });
});
