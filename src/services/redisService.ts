/**
 * Redis Service - Production-ready caching and rate limiting
 *
 * Provides distributed caching, rate limiting, session storage, and
 * pub/sub functionality using Redis with connection pooling and failover.
 */

// Only import Redis in server environment
let Redis: unknown = null;
let RedisOptions: unknown = null;

// Check if we're on the server side (Node.js environment)
const isServerSide = typeof window === 'undefined' && typeof process !== 'undefined';

if (isServerSide) {
  try {
    // const ioredisModule = await import('ioredis');
    Redis = ioredisModule.default;
    RedisOptions = ioredisModule.RedisOptions;
  } catch (_error) {
    // // console.warn('Redis not available - using fallback mode');
  }
}

// Safe imports for logging services
let securityLogger: unknown = null;
let SecurityEventType: unknown = null;

if (isServerSide) {
  try {
    // const securityModule = await import('../security/logging');
    securityLogger = securityModule.securityLogger;
    SecurityEventType = securityModule.SecurityEventType;
  } catch (_error) {
    // // console.warn('Security logging not available in client environment');
  }
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  connectTimeout: number;
  lazyConnect: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if not exists
  ex?: number; // Expire in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

class RedisService {
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private config: RedisConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize Redis connection with retry logic
   */
  async initialize(customConfig?: Partial<RedisConfig>): Promise<void> {
    // Skip initialization on client side
    if (!isServerSide || !Redis) {
      // // console.warn('Redis service not available - running in fallback mode');
      return;
    }

    try {
      this.config = { ...this.config, ...customConfig };

      const redisOptions: RedisOptions = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        enableOfflineQueue: this.config.enableOfflineQueue,
        connectTimeout: this.config.connectTimeout,
        lazyConnect: this.config.lazyConnect,
        // Connection pool settings
        family: 4,
        keepAlive: true,
        // Reconnection settings
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
      };

      await this.connect(redisOptions);

      securityLogger.info('Redis service initialized successfully', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
      });
    } catch (_error) {
      securityLogger.error('Redis service initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        attempts: this.connectionAttempts,
      });
      throw error;
    }
  }

  /**
   * Connect to Redis with retry logic
   */
  private async connect(options: RedisOptions): Promise<void> {
    if (!Redis) {
      throw new Error('Redis not available in client environment');
    }

    while (this.connectionAttempts < this.maxRetries && !this.isConnected) {
      try {
        this.connectionAttempts++;

        // Create main client
        this.client = new Redis(options);
        this.setupEventListeners(this.client, 'main');

        // Create pub/sub clients
        this.subscriber = new Redis(options);
        this.publisher = new Redis(options);
        this.setupEventListeners(this.subscriber, 'subscriber');
        this.setupEventListeners(this.publisher, 'publisher');

        // Test connection
        await this.client.ping();

        this.isConnected = true;
        securityLogger.info('Redis connection established', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
        });

        return;
      } catch (_error) {
        securityLogger.warn('Redis connection attempt failed', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts`);
        }

        // Wait before retrying
        await this.delay(1000 * this.connectionAttempts);
      }
    }
  }

  /**
   * Setup event listeners for Redis clients
   */
  private setupEventListeners(client: Redis, clientType: string): void {
    client.on('connect', () => {
      securityLogger.info(`Redis ${clientType} client connected`);
    });

    client.on('ready', () => {
      securityLogger.info(`Redis ${clientType} client ready`);
    });

    client.on('error', (error) => {
      securityLogger.error(`Redis ${clientType} client error`, {
        error: error.message,
        clientType,
      });
    });

    client.on('close', () => {
      securityLogger.warn(`Redis ${clientType} client connection closed`);
      this.isConnected = false;
    });

    client.on('reconnecting', () => {
      securityLogger.info(`Redis ${clientType} client reconnecting`);
    });
  }

  /**
   * Cache operations
   */

  /**
   * Set a value in cache
   */
  async set(key: string, value: unknown, options?: CacheOptions): Promise<boolean> {
    if (!isServerSide || !Redis || !this.client) {
      // // console.warn('Redis SET operation skipped - not available in client environment');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);

      if (options?.ttl) {
        await this.client.setex(key, options.ttl, serializedValue);
      } else if (options?.ex) {
        await this.client.setex(key, options.ex, serializedValue);
      } else if (options?.nx) {
        const result = await this.client.setnx(key, serializedValue);
        return result === 1;
      } else {
        await this.client.set(key, serializedValue);
      }

      return true;
    } catch (_error) {
      securityLogger.error('Redis SET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!isServerSide || !Redis || !this.client) {
      // // console.warn('Redis GET operation skipped - not available in client environment');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (_error) {
      securityLogger.error('Redis GET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (_error) {
      securityLogger.error('Redis DEL operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (_error) {
      securityLogger.error('Redis EXISTS operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (_error) {
      securityLogger.error('Redis EXPIRE operation failed', {
        key,
        seconds,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Rate limiting operations
   */

  /**
   * Check and increment rate limit
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
    prefix = 'rate_limit',
  ): Promise<RateLimitResult> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      // Use a Lua script for atomic operations
      const luaScript = `
        local key = KEYS[1]
        local window_start = tonumber(ARGV[1])
        local max_requests = tonumber(ARGV[2])
        local current_time = tonumber(ARGV[3])
        local window_seconds = tonumber(ARGV[4])

        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

        -- Count current requests in window
        local current_requests = redis.call('ZCARD', key)

        if current_requests < max_requests then
          -- Add current request
          redis.call('ZADD', key, current_time, current_time)
          redis.call('EXPIRE', key, window_seconds)
          return {1, max_requests - current_requests - 1, current_requests + 1}
        else
          -- Rate limit exceeded
          return {0, 0, current_requests}
        end
      `;

      const result = await this.client.eval(
        luaScript,
        1,
        key,
        windowStart.toString(),
        maxRequests.toString(),
        now.toString(),
        windowSeconds.toString(),
      ) as [number, number, number];

      const [allowed, remaining, totalRequests] = result;
      const resetTime = now + (windowSeconds * 1000);

      const rateLimitResult: RateLimitResult = {
        allowed: allowed === 1,
        remaining,
        resetTime,
        totalRequests,
      };

      // Log rate limit events
      if (!rateLimitResult.allowed) {
        securityLogger.logSecurityEvent(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          {
            metadata: {
              identifier,
              maxRequests,
              windowSeconds,
              totalRequests,
            },
          },
        );
      }

      return rateLimitResult;
    } catch (_error) {
      securityLogger.error('Redis rate limit check failed', {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + (windowSeconds * 1000),
        totalRequests: 1,
      };
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async resetRateLimit(identifier: string, prefix = 'rate_limit'): Promise<boolean> {
    const key = `${prefix}:${identifier}`;
    return await this.del(key);
  }

  /**
   * Session operations
   */

  /**
   * Store session data
   */
  async setSession(sessionId: string, sessionData: unknown, ttlSeconds = 3600): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, { ttl: ttlSeconds });
  }

  /**
   * Get session data
   */
  async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.get<T>(key);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  /**
   * Pub/Sub operations
   */

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: unknown): Promise<number> {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized');
    }

    try {
      const serializedMessage = JSON.stringify(message);
      const result = await this.publisher.publish(channel, serializedMessage);
      return result;
    } catch (_error) {
      securityLogger.error('Redis PUBLISH operation failed', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel: string, callback: (message: unknown) => void): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized');
    }

    try {
      await this.subscriber.subscribe(channel);

      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (_error) {
            securityLogger.error('Failed to parse Redis message', {
              channel: receivedChannel,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      });
    } catch (_error) {
      securityLogger.error('Redis SUBSCRIBE operation failed', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    details: {
      connected: boolean;
      version?: string;
      memory?: string;
      uptime?: number;
    };
  }> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        throw new Error('Redis client not initialized');
      }

      // Test basic connectivity
      await this.client.ping();

      // Get Redis info
      const info = await this.client.info();
      const version = this.parseRedisVersion(info);
      const memory = this.parseRedisMemory(info);
      const uptime = this.parseRedisUptime(info);

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        details: {
          connected: this.isConnected,
          version,
          memory,
          uptime,
        },
      };
    } catch (_error) {
      const latency = Date.now() - startTime;

      securityLogger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
      });

      return {
        status: 'unhealthy',
        latency,
        details: {
          connected: false,
        },
      };
    }
  }

  /**
   * Get Redis statistics
   */
  async getStatistics(): Promise<{
    connectedClients: number;
    usedMemory: number;
    totalCommands: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    uptime: number;
  }> {
    try {
      if (!this.client) {
        throw new Error('Redis client not initialized');
      }

      const info = await this.client.info();

      return {
        connectedClients: this.parseInfoValue(info, 'connected_clients') || 0,
        usedMemory: this.parseInfoValue(info, 'used_memory') || 0,
        totalCommands: this.parseInfoValue(info, 'total_commands_processed') || 0,
        keyspaceHits: this.parseInfoValue(info, 'keyspace_hits') || 0,
        keyspaceMisses: this.parseInfoValue(info, 'keyspace_misses') || 0,
        uptime: this.parseInfoValue(info, 'uptime_in_seconds') || 0,
      };
    } catch (_error) {
      securityLogger.error('Failed to get Redis statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        connectedClients: 0,
        usedMemory: 0,
        totalCommands: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }

      this.isConnected = false;
      securityLogger.info('Redis connections closed gracefully');
    } catch (_error) {
      securityLogger.error('Error during Redis disconnection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    if (!isServerSide || !Redis) {
      return false; // Not available on client side
    }
    return this.isConnected && this.client !== null;
  }

  /**
   * Utility methods
   */

  private getDefaultConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'astral-turf:',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      lazyConnect: true,
    };
  }

  private parseRedisVersion(info: string): string | undefined {
    const match = info.match(/redis_version:([^\r\n]+)/);
    return match ? match[1] : undefined;
  }

  private parseRedisMemory(info: string): string | undefined {
    const match = info.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1] : undefined;
  }

  private parseRedisUptime(info: string): number | undefined {
    const match = info.match(/uptime_in_seconds:([^\r\n]+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  private parseInfoValue(info: string, key: string): number | undefined {
    const match = info.match(new RegExp(`${key}:([^\r\n]+)`));
    return match ? parseInt(match[1]) : undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const redisService = new RedisService();

// Export utility functions
export const cache = {
  set: (key: string, value: unknown, options?: CacheOptions) => redisService.set(key, value, options),
  get: <T = any>(key: string) => redisService.get<T>(key),
  del: (key: string) => redisService.del(key),
  exists: (key: string) => redisService.exists(key),
  expire: (key: string, seconds: number) => redisService.expire(key, seconds),
};

export const rateLimit = {
  check: (identifier: string, maxRequests: number, windowSeconds: number, prefix?: string) =>
    redisService.checkRateLimit(identifier, maxRequests, windowSeconds, prefix),
  reset: (identifier: string, prefix?: string) => redisService.resetRateLimit(identifier, prefix),
};
