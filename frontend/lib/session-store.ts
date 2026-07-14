import { getRedisClient } from './redis-session';
import { SessionRecord, SessionStore } from './session.types';

const MAX_SESSIONS = Number(process.env.MAX_SESSIONS_PER_USER ?? 3);
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function key(sessionId: string): string {
  return `session:${sessionId}`;
}

function userIndexKey(userId: string): string {
  return `user:${userId}:sessions`;
}

export class RedisSessionStore implements SessionStore {
  async create(record: SessionRecord): Promise<void> {
    const redis = getRedisClient();
    await redis.set(key(record.sessionId), JSON.stringify(record), 'EX', SESSION_TTL_SECONDS);
    await redis.sadd(userIndexKey(record.userId), record.sessionId);
    await this.evictOldest(record.userId);
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    const redis = getRedisClient();
    const raw = await redis.get(key(sessionId));
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }

  async updateRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
    const record = await this.get(sessionId);
    if (!record) return;
    record.refreshToken = refreshToken;
    record.lastActivityAt = new Date().toISOString();
    const redis = getRedisClient();
    await redis.set(key(sessionId), JSON.stringify(record), 'EX', SESSION_TTL_SECONDS);
  }

  async touch(sessionId: string): Promise<void> {
    const record = await this.get(sessionId);
    if (!record) return;
    record.lastActivityAt = new Date().toISOString();
    const redis = getRedisClient();
    await redis.set(key(sessionId), JSON.stringify(record), 'EX', SESSION_TTL_SECONDS);
  }

  async revoke(sessionId: string): Promise<void> {
    const record = await this.get(sessionId);
    const redis = getRedisClient();
    await redis.del(key(sessionId));
    if (record) {
      await redis.srem(userIndexKey(record.userId), sessionId);
    }
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const sessions = await this.listForUser(userId);
    for (const session of sessions) {
      await this.revoke(session.sessionId);
    }
    return sessions.length;
  }

  async listForUser(userId: string): Promise<SessionRecord[]> {
    const redis = getRedisClient();
    const ids = await redis.smembers(userIndexKey(userId));
    const records: SessionRecord[] = [];
    for (const id of ids) {
      const record = await this.get(id);
      if (record) records.push(record);
    }
    return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private async evictOldest(userId: string): Promise<void> {
    const sessions = await this.listForUser(userId);
    while (sessions.length > MAX_SESSIONS) {
      const oldest = sessions.shift();
      if (oldest) await this.revoke(oldest.sessionId);
    }
  }
}

export const sessionStore = new RedisSessionStore();
