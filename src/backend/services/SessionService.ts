/**
 * Session Service - Advanced Session Management
 *
 * Features:
 * - View all active sessions
 * - Revoke specific sessions
 * - Device tracking and fingerprinting
 * - Geographic location tracking
 * - Session activity monitoring
 * - Automatic session cleanup
 */

import { phoenixPool } from '../database/PhoenixDatabasePool';
import { createHash } from 'crypto';

export interface SessionInfo {
  id: string;
  deviceInfo: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ipAddress: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
  isActive: boolean;
}

export class SessionService {
  /**
   * Get all sessions for user
   */
  async getUserSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<{
    success: boolean;
    sessions?: SessionInfo[];
    totalSessions?: number;
    activeSessions?: number;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT 
          id,
          device_info,
          ip_address,
          last_activity_at,
          created_at,
          expires_at,
          is_active,
          user_agent,
          device_fingerprint
         FROM user_sessions
         WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
         ORDER BY last_activity_at DESC`,
        [userId]
      );

      const sessions: SessionInfo[] = result.rows.map(row => {
        const deviceInfo = this.parseDeviceInfo(row.user_agent);

        return {
          id: row.id,
          deviceInfo: row.device_info || this.formatDeviceInfo(deviceInfo),
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ipAddress: row.ip_address,
          location: undefined, // Will be populated with GeoIP lookup
          lastActivity: row.last_activity_at,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          current: row.id === currentSessionId,
          isActive: row.is_active,
        };
      });

      // Try to get geographic location for sessions
      await this.enrichSessionsWithLocation(sessions);

      return {
        success: true,
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
      };
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(
    sessionId: string,
    userId: string,
    currentSessionId?: string
  ): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Prevent revoking current session
      if (sessionId === currentSessionId) {
        return {
          success: false,
          message: 'Cannot revoke your current session. Use logout instead.',
        };
      }

      // Verify session ownership and revoke
      const result = await phoenixPool.query(
        `UPDATE user_sessions
         SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND is_active = true
         RETURNING id`,
        [sessionId, userId]
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          message: 'Session not found or already revoked',
        };
      }

      // Log security event
      await this.logSecurityEvent(userId, 'SESSION_REVOKED', {
        sessionId,
        revokedBy: currentSessionId,
      });

      return {
        success: true,
        message: 'Session revoked successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to revoke session',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(
    userId: string,
    currentSessionId: string
  ): Promise<{
    success: boolean;
    message: string;
    revokedCount?: number;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `UPDATE user_sessions
         SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND id != $2 AND is_active = true
         RETURNING id`,
        [userId, currentSessionId]
      );

      const revokedCount = result.rowCount || 0;

      // Log security event
      await this.logSecurityEvent(userId, 'ALL_SESSIONS_REVOKED', {
        count: revokedCount,
        keptSessionId: currentSessionId,
      });

      return {
        success: true,
        message: `Revoked ${revokedCount} session(s) successfully`,
        revokedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to revoke sessions',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(
    sessionId: string,
    userId: string
  ): Promise<{
    success: boolean;
    session?: SessionInfo;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT 
          id,
          device_info,
          ip_address,
          last_activity_at,
          created_at,
          expires_at,
          is_active,
          user_agent,
          device_fingerprint
         FROM user_sessions
         WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Session not found',
        };
      }

      const row = result.rows[0];
      const deviceInfo = this.parseDeviceInfo(row.user_agent);

      const session: SessionInfo = {
        id: row.id,
        deviceInfo: row.device_info || this.formatDeviceInfo(deviceInfo),
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: row.ip_address,
        lastActivity: row.last_activity_at,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        current: false,
        isActive: row.is_active,
      };

      // Enrich with location
      session.location = await this.getLocationFromIP(session.ipAddress);

      return {
        success: true,
        session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session',
      };
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `DELETE FROM user_sessions
         WHERE expires_at < NOW() OR (is_active = false AND updated_at < NOW() - INTERVAL '7 days')
         RETURNING id`
      );

      return {
        success: true,
        deletedCount: result.rowCount || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup sessions',
      };
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(
    sessionId: string,
    ipAddress: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await phoenixPool.query(
        `UPDATE user_sessions
         SET last_activity_at = NOW(), ip_address = $1, updated_at = NOW()
         WHERE id = $2 AND is_active = true`,
        [ipAddress, sessionId]
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session',
      };
    }
  }

  /**
   * Create new session
   */
  async createSession(data: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    expiresIn?: number; // seconds
  }): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    try {
      const deviceInfo = this.parseDeviceInfo(data.userAgent);
      const expiresAt = new Date(Date.now() + (data.expiresIn || 7 * 24 * 60 * 60) * 1000);

      const result = await phoenixPool.query(
        `INSERT INTO user_sessions (
          user_id,
          ip_address,
          user_agent,
          device_info,
          device_fingerprint,
          expires_at,
          is_active,
          last_activity_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        RETURNING id`,
        [
          data.userId,
          data.ipAddress,
          data.userAgent,
          this.formatDeviceInfo(deviceInfo),
          data.deviceFingerprint || this.generateDeviceFingerprint(data.userAgent, data.ipAddress),
          expiresAt,
        ]
      );

      return {
        success: true,
        sessionId: result.rows[0].id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      };
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    userId?: string;
    expired?: boolean;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT user_id, expires_at, is_active
         FROM user_sessions
         WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const session = result.rows[0];

      if (!session.is_active) {
        return { valid: false };
      }

      if (new Date(session.expires_at) < new Date()) {
        return { valid: false, expired: true };
      }

      return {
        valid: true,
        userId: session.user_id,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  // Private helper methods

  /**
   * Parse device information from User-Agent
   */
  private parseDeviceInfo(userAgent: string): {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  } {
    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
    if (ua.includes('mobile')) deviceType = 'mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';
    else if (ua.includes('windows') || ua.includes('mac os') || ua.includes('linux'))
      deviceType = 'desktop';

    return { browser, os, deviceType };
  }

  /**
   * Format device info for display
   */
  private formatDeviceInfo(info: { browser: string; os: string; deviceType: string }): string {
    return `${info.browser} on ${info.os}`;
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    return createHash('sha256')
      .update(`${userAgent}|${ipAddress}`)
      .digest('hex');
  }

  /**
   * Enrich sessions with geographic location
   */
  private async enrichSessionsWithLocation(sessions: SessionInfo[]): Promise<void> {
    for (const session of sessions) {
      session.location = await this.getLocationFromIP(session.ipAddress);
    }
  }

  /**
   * Get geographic location from IP address
   * This is a placeholder - integrate with a GeoIP service in production
   */
  private async getLocationFromIP(
    ipAddress: string
  ): Promise<{ city?: string; region?: string; country?: string } | undefined> {
    // TODO: Integrate with GeoIP service (MaxMind, IP2Location, etc.)
    // For now, return undefined or mock data for localhost

    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.')) {
      return {
        city: 'Local',
        region: 'Local',
        country: 'Local',
      };
    }

    return undefined;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await phoenixPool.query(
        `INSERT INTO system_logs (
          level,
          message,
          timestamp,
          service,
          metadata,
          security_event_type,
          user_id
        )
        VALUES ('info', $1, NOW(), 'session-service', $2, $3, $4)`,
        [
          `Security event: ${eventType}`,
          JSON.stringify(metadata),
          eventType,
          userId,
        ]
      );
    } catch (error) {
      // Silently fail - logging shouldn't break the main flow
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
