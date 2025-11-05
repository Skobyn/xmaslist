/**
 * Redis Cache Implementation for Metadata
 * Uses Upstash Redis for serverless-friendly caching
 */

import type { UrlMetadata, MetadataCacheEntry, CacheConfig } from '@/types/metadata';

// ============================================================================
// Cache Configuration
// ============================================================================

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 3600, // 1 hour in seconds
  prefix: 'metadata:',
  compress: false,
};

// ============================================================================
// In-Memory Cache (Fallback)
// ============================================================================

/**
 * Simple in-memory cache for development/testing
 */
class InMemoryCache {
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// ============================================================================
// Redis Cache Client
// ============================================================================

/**
 * Redis cache client (can be swapped with Upstash Redis)
 */
export class MetadataCache {
  private client: InMemoryCache; // Replace with Upstash Redis client in production
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.client = new InMemoryCache(); // Replace with: new Redis({ url: UPSTASH_REDIS_URL })
  }

  /**
   * Get cached metadata for URL
   */
  async get(url: string): Promise<UrlMetadata | null> {
    try {
      const key = this.generateKey(url);
      const cached = await this.client.get(key);

      if (!cached) return null;

      const entry: MetadataCacheEntry = JSON.parse(cached);

      // Check expiration
      if (new Date(entry.expiresAt) < new Date()) {
        await this.client.del(key);
        return null;
      }

      // Increment hit counter
      entry.hits++;
      await this.client.set(key, JSON.stringify(entry), this.config.ttl);

      return entry.metadata;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached metadata for URL
   */
  async set(url: string, metadata: UrlMetadata, ttl?: number): Promise<void> {
    try {
      const key = this.generateKey(url);
      const cacheTtl = ttl || this.config.ttl;

      const entry: MetadataCacheEntry = {
        url,
        metadata,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + cacheTtl * 1000).toISOString(),
        hits: 0,
      };

      await this.client.set(key, JSON.stringify(entry), cacheTtl);
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - cache failures should not break the app
    }
  }

  /**
   * Delete cached metadata for URL
   */
  async del(url: string): Promise<void> {
    try {
      const key = this.generateKey(url);
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Check if URL is cached
   */
  async has(url: string): Promise<boolean> {
    const metadata = await this.get(url);
    return metadata !== null;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.client.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Generate cache key for URL
   */
  private generateKey(url: string): string {
    // Normalize URL for consistent caching
    const normalized = url.toLowerCase().trim();

    // Use hash for shorter keys (in production, use a proper hash function)
    const hash = this.simpleHash(normalized);

    return `${this.config.prefix}${hash}`;
  }

  /**
   * Simple hash function (replace with proper hash in production)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// ============================================================================
// Cache Statistics
// ============================================================================

/**
 * Cache statistics tracker
 */
export class CacheStats {
  private hits = 0;
  private misses = 0;
  private errors = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  recordError(): void {
    this.errors++;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      total,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheInstance: MetadataCache | null = null;
let statsInstance: CacheStats | null = null;

/**
 * Get cache instance (singleton)
 */
export function getCache(config?: Partial<CacheConfig>): MetadataCache {
  if (!cacheInstance) {
    cacheInstance = new MetadataCache(config);
  }
  return cacheInstance;
}

/**
 * Get cache stats instance (singleton)
 */
export function getCacheStats(): CacheStats {
  if (!statsInstance) {
    statsInstance = new CacheStats();
  }
  return statsInstance;
}
