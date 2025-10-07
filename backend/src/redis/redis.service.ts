import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Session storage will use PostgreSQL fallback.');
      return;
    }

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', err => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    try {
      await this.client.connect();
      this.logger.log('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.client && this.client.isOpen;
  }

  /**
   * Set a key-value pair with optional expiration (in seconds)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.get(key);
  }

  /**
   * Delete key(s)
   */
  async del(key: string | string[]): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    if (Array.isArray(key)) {
      return await this.client.del(key);
    }
    return await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration time for a key (in seconds)
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.expire(key, seconds);
  }

  /**
   * Get time to live for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.ttl(key);
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.keys(pattern);
  }

  /**
   * Set object as JSON
   */
  async setObject(key: string, value: Record<string, unknown>, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  /**
   * Get object from JSON
   */
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON for key ${key}`, error);
      return null;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    return await this.client.decr(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    return await this.del(keys);
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Redis client not available');
    }

    await this.client.flushAll();
    this.logger.warn('Redis database flushed');
  }
}
