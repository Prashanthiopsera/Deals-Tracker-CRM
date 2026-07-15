import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
  }
  return client;
}

export async function storeRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
  const redis = getRedisClient();
  await redis.set(`session:${sessionId}:refresh`, refreshToken, 'EX', 60 * 60 * 8);
}

export async function getRefreshToken(sessionId: string): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(`session:${sessionId}:refresh`);
}

export async function deleteRefreshToken(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`session:${sessionId}:refresh`);
}
