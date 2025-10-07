import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../users/entities/session.entity';

interface SessionData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>
  ) {}

  /**
   * Create a new session (stores in Redis if available, otherwise PostgreSQL)
   */
  async createSession(sessionData: SessionData): Promise<string> {
    const sessionId = this.generateSessionId();
    const ttl = Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000);

    // Try Redis first
    if (this.redisService.isAvailable()) {
      try {
        // Store session data
        await this.redisService.setObject(`${this.SESSION_PREFIX}${sessionId}`, sessionData, ttl);

        // Track user sessions
        await this.addUserSession(sessionData.userId, sessionId);

        this.logger.log(`Session ${sessionId} created in Redis for user ${sessionData.userId}`);
        return sessionId;
      } catch (error) {
        this.logger.error('Failed to create session in Redis, falling back to PostgreSQL', error);
      }
    }

    // Fallback to PostgreSQL
    const session = this.sessionRepository.create({
      userId: sessionData.userId,
      refreshToken: sessionData.refreshToken,
      expiresAt: sessionData.expiresAt,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
    });

    await this.sessionRepository.save(session);
    this.logger.log(`Session created in PostgreSQL for user ${sessionData.userId}`);
    return session.id;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    // Try Redis first
    if (this.redisService.isAvailable()) {
      try {
        const session = await this.redisService.getObject<SessionData>(
          `${this.SESSION_PREFIX}${sessionId}`
        );
        if (session) {
          return session;
        }
      } catch (error) {
        this.logger.error('Failed to get session from Redis', error);
      }
    }

    // Fallback to PostgreSQL
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Try Redis first
    if (this.redisService.isAvailable()) {
      try {
        const session = await this.getSession(sessionId);
        if (session) {
          await this.redisService.del(`${this.SESSION_PREFIX}${sessionId}`);
          await this.removeUserSession(session.userId, sessionId);
          this.logger.log(`Session ${sessionId} deleted from Redis`);
          return;
        }
      } catch (error) {
        this.logger.error('Failed to delete session from Redis', error);
      }
    }

    // Fallback to PostgreSQL
    await this.sessionRepository.delete({ id: sessionId });
    this.logger.log(`Session ${sessionId} deleted from PostgreSQL`);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    // Try Redis first
    if (this.redisService.isAvailable()) {
      try {
        const sessionIds = await this.getUserSessions(userId);
        if (sessionIds.length > 0) {
          const keys = sessionIds.map(id => `${this.SESSION_PREFIX}${id}`);
          await this.redisService.del(keys);
          await this.redisService.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
          this.logger.log(`Deleted ${sessionIds.length} Redis sessions for user ${userId}`);
          return;
        }
      } catch (error) {
        this.logger.error('Failed to delete user sessions from Redis', error);
      }
    }

    // Fallback to PostgreSQL
    await this.sessionRepository.delete({ userId });
    this.logger.log(`Deleted PostgreSQL sessions for user ${userId}`);
  }

  /**
   * Blacklist an access token (for immediate logout)
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    if (!this.redisService.isAvailable()) {
      this.logger.warn('Redis not available, token blacklist not supported');
      return;
    }

    try {
      await this.redisService.set(`${this.BLACKLIST_PREFIX}${token}`, '1', expiresIn);
      this.logger.log('Token blacklisted');
    } catch (error) {
      this.logger.error('Failed to blacklist token', error);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.redisService.isAvailable()) {
      return false;
    }

    try {
      return await this.redisService.exists(`${this.BLACKLIST_PREFIX}${token}`);
    } catch (error) {
      this.logger.error('Failed to check token blacklist', error);
      return false;
    }
  }

  /**
   * Get all session IDs for a user
   */
  private async getUserSessions(userId: string): Promise<string[]> {
    if (!this.redisService.isAvailable()) {
      return [];
    }

    try {
      const data = await this.redisService.get(`${this.USER_SESSIONS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this.logger.error('Failed to get user sessions', error);
      return [];
    }
  }

  /**
   * Add a session ID to user's session list
   */
  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    sessions.push(sessionId);
    await this.redisService.set(`${this.USER_SESSIONS_PREFIX}${userId}`, JSON.stringify(sessions));
  }

  /**
   * Remove a session ID from user's session list
   */
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    const filtered = sessions.filter(id => id !== sessionId);

    if (filtered.length > 0) {
      await this.redisService.set(
        `${this.USER_SESSIONS_PREFIX}${userId}`,
        JSON.stringify(filtered)
      );
    } else {
      await this.redisService.del(`${this.USER_SESSIONS_PREFIX}${userId}`);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Clean up expired sessions from PostgreSQL (for maintenance)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    const count = result.affected || 0;
    this.logger.log(`Cleaned up ${count} expired sessions from PostgreSQL`);
    return count;
  }
}
