import { InMemorySessionStore } from './session-store.mock';

describe('InMemorySessionStore', () => {
  it('creates, refreshes, and revokes sessions', async () => {
    const store = new InMemorySessionStore();
    const record = {
      sessionId: 's1',
      userId: 'u1',
      role: 'Director',
      refreshToken: 'rt1',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    await store.create(record);
    expect(await store.get('s1')).not.toBeNull();
    await store.updateRefreshToken('s1', 'rt2');
    expect((await store.get('s1'))?.refreshToken).toBe('rt2');
    await store.revoke('s1');
    expect(await store.get('s1')).toBeNull();
  });

  it('revokes all sessions for a user', async () => {
    const store = new InMemorySessionStore();
    const base = {
      userId: 'u2',
      role: 'Intern',
      refreshToken: 'rt',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    await store.create({ ...base, sessionId: 's2' });
    await store.create({ ...base, sessionId: 's3' });
    expect(await store.revokeAllForUser('u2')).toBe(2);
    expect(await store.listForUser('u2')).toHaveLength(0);
  });
});
