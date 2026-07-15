import { SessionStore, SessionRecord } from './session.types';

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly userSessions = new Map<string, Set<string>>();

  async create(record: SessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, record);
    const set = this.userSessions.get(record.userId) ?? new Set<string>();
    set.add(record.sessionId);
    this.userSessions.set(record.userId, set);
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async updateRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (!record) return;
    record.refreshToken = refreshToken;
    record.lastActivityAt = new Date().toISOString();
  }

  async touch(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (record) record.lastActivityAt = new Date().toISOString();
  }

  async revoke(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    if (record) this.userSessions.get(record.userId)?.delete(sessionId);
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const ids = [...(this.userSessions.get(userId) ?? [])];
    for (const id of ids) await this.revoke(id);
    return ids.length;
  }

  async listForUser(userId: string): Promise<SessionRecord[]> {
    const ids = [...(this.userSessions.get(userId) ?? [])];
    return ids.map((id) => this.sessions.get(id)).filter(Boolean) as SessionRecord[];
  }
}
