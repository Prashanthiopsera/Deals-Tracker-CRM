import {
  InMemoryCedarCache,
  LayeredCedarCache,
  RedisCedarCache,
} from './cedar-cache';
import { CedarAuthDecision } from './cedar.types';

const decision = (): CedarAuthDecision => ({
  allowed: true,
  policyId: 'local-rbac-matrix',
  cached: false,
  latencyMs: 1,
});

describe('InMemoryCedarCache (WO-010)', () => {
  const cache = new InMemoryCedarCache();

  it('stores and returns cached decisions', async () => {
    await cache.set('user:read', decision());
    const hit = await cache.get('user:read');
    expect(hit?.cached).toBe(true);
    expect(hit?.allowed).toBe(true);
  });

  it('expires entries after ttl', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(120_000);
    await cache.set('expired', decision());
    expect(await cache.get('expired')).toBeUndefined();
    jest.restoreAllMocks();
  });

  it('invalidates keys for a user prefix', async () => {
    await cache.set('user-1:read', decision());
    await cache.set('user-2:read', decision());
    await cache.invalidateForUser('user-1');
    expect(await cache.get('user-1:read')).toBeUndefined();
    expect(await cache.get('user-2:read')).toBeDefined();
  });
});

describe('LayeredCedarCache (WO-010)', () => {
  const memory = new InMemoryCedarCache();
  const redis = new RedisCedarCache();
  const cache = new LayeredCedarCache(memory, redis);

  it('reads from memory before redis', async () => {
    await memory.set('layered', decision());
    const hit = await cache.get('layered');
    expect(hit?.cached).toBe(true);
  });

  it('writes to both layers', async () => {
    await cache.set('both', decision());
    expect(await memory.get('both')).toBeDefined();
  });
});

describe('RedisCedarCache without REDIS_URL (WO-010)', () => {
  const original = process.env.REDIS_URL;

  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    process.env.REDIS_URL = original;
  });

  it('no-ops when redis is not configured', async () => {
    const cache = new RedisCedarCache();
    await cache.set('missing', decision());
    expect(await cache.get('missing')).toBeUndefined();
    await cache.invalidateForUser('missing');
    await cache.onModuleDestroy();
  });
});
