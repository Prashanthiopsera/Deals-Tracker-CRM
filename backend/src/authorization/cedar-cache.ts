import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CedarAuthDecision } from './cedar.types';

export interface CedarCache {
  get(key: string): Promise<CedarAuthDecision | undefined>;
  set(key: string, decision: CedarAuthDecision): Promise<void>;
  invalidateForUser(userId: string): Promise<void>;
}

interface CacheEntry {
  decision: CedarAuthDecision;
  expiresAt: number;
}

@Injectable()
export class InMemoryCedarCache implements CedarCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs = 60_000;
  private readonly maxEntries = 1000;

  async get(key: string): Promise<CedarAuthDecision | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return { ...entry.decision, cached: true };
  }

  async set(key: string, decision: CedarAuthDecision): Promise<void> {
    if (this.entries.size >= this.maxEntries) {
      const firstKey = this.entries.keys().next().value as string;
      this.entries.delete(firstKey);
    }
    this.entries.set(key, { decision, expiresAt: Date.now() + this.ttlMs });
  }

  async invalidateForUser(userId: string): Promise<void> {
    for (const key of this.entries.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.entries.delete(key);
      }
    }
  }
}

@Injectable()
export class RedisCedarCache implements CedarCache, OnModuleDestroy {
  private readonly logger = new Logger(RedisCedarCache.name);
  private readonly ttlSeconds = 60;
  private client: import('ioredis').default | null = null;

  private async getClient(): Promise<import('ioredis').default | null> {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    if (!this.client) {
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await this.client.connect();
    }
    return this.client;
  }

  async get(key: string): Promise<CedarAuthDecision | undefined> {
    const client = await this.getClient();
    if (!client) return undefined;
    try {
      const raw = await client.get(`cedar:${key}`);
      if (!raw) return undefined;
      const decision = JSON.parse(raw) as CedarAuthDecision;
      return { ...decision, cached: true };
    } catch (error) {
      this.logger.warn(`Redis cache get failed: ${String(error)}`);
      return undefined;
    }
  }

  async set(key: string, decision: CedarAuthDecision): Promise<void> {
    const client = await this.getClient();
    if (!client) return;
    try {
      await client.setex(`cedar:${key}`, this.ttlSeconds, JSON.stringify(decision));
    } catch (error) {
      this.logger.warn(`Redis cache set failed: ${String(error)}`);
    }
  }

  async invalidateForUser(userId: string): Promise<void> {
    const client = await this.getClient();
    if (!client) return;
    try {
      const keys = await client.keys(`cedar:${userId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Redis cache invalidate failed: ${String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

@Injectable()
export class LayeredCedarCache implements CedarCache {
  constructor(
    private readonly memory: InMemoryCedarCache,
    private readonly redis: RedisCedarCache,
  ) {}

  async get(key: string): Promise<CedarAuthDecision | undefined> {
    const memoryHit = await this.memory.get(key);
    if (memoryHit) return memoryHit;
    const redisHit = await this.redis.get(key);
    if (redisHit) {
      await this.memory.set(key, redisHit);
    }
    return redisHit;
  }

  async set(key: string, decision: CedarAuthDecision): Promise<void> {
    await Promise.all([this.memory.set(key, decision), this.redis.set(key, decision)]);
  }

  async invalidateForUser(userId: string): Promise<void> {
    await Promise.all([
      this.memory.invalidateForUser(userId),
      this.redis.invalidateForUser(userId),
    ]);
  }
}
