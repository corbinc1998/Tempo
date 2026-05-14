/**
 * In-memory cache for aggregated responses.
 *
 * Why in-memory and not Redis:
 *   - Simpler. One process, one cache, no extra moving parts.
 *   - Free.
 *   - Fast - no network hop.
 *
 * What we lose:
 *   - Coherence across multiple BFF replicas. User A's request to task 1 sees a
 *     cached response; their next request to task 2 sees a different one.
 *   - Cache survives process restart? Nope. Every cold start is empty.
 *
 * Upgrade path (when to switch to Redis):
 *   - You're running 2+ BFF tasks
 *   - Cache miss latency becomes a problem on deploys
 *   - You need cross-region cache (probably never for this app)
 *
 * See ROADMAP.md "Worked example 4" for the migration to ElastiCache.
 *
 * Why this interface (get/set/invalidate):
 *   Keeps the abstraction thin so swapping the backing store doesn't require route
 *   handler changes. Don't over-engineer this. If you need more (eviction callbacks,
 *   stats, async access), add it, but only when you actually use it.
 */
import { LRUCache } from 'lru-cache';
import { config } from './config.js';

const lru = new LRUCache<string, unknown>({
  max: 500,                            // max entries
  ttl: config.cacheTtlSeconds * 1000,  // TTL in ms
  updateAgeOnGet: false,               // age based on insert, not access
});

export const cache = {
  get<T>(key: string): T | undefined {
    return lru.get(key) as T | undefined;
  },

  set<T>(key: string, value: T): void {
    lru.set(key, value);
  },

  /**
   * Remove all keys with a given prefix. Useful when ingest happens and you want
   * to bust everything related to "predictions" without enumerating individual keys.
   */
  invalidatePrefix(prefix: string): number {
    let removed = 0;
    for (const key of lru.keys()) {
      if (key.startsWith(prefix)) {
        lru.delete(key);
        removed++;
      }
    }
    return removed;
  },

  clear(): void {
    lru.clear();
  },
};
