/**
 * Collaboration Service - WebSocket Real-time Collaboration with Database Persistence
 *
 * Provides comprehensive real-time collaboration features for tactical boards:
 * - Session management with database persistence
 * - Real-time updates with conflict resolution
 * - Participant presence tracking
 * - Update history and version control
 * - Cursor tracking and awareness
 * - Permission-based editing
 *
 * Uses:
 * - Database for persistent storage
 * - WebSocket for real-time communication
 * - AppState table for session/update storage
 */

import { databaseService } from './databaseService';
import { securityLogger } from '../security/logging';

export interface CollaborationSession {
  id: string;
  formationId: string;
  participants: Array<{
    userId: string;
    userName: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: Date;
    lastSeen: Date;
    cursor?: { x: number; y: number };
    socketId?: string;
  }>;
  startedAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface RealTimeUpdate {
  id: string;
  sessionId: string;
  userId: string;
  type: 'player_move' | 'formation_change' | 'tactical_instruction' | 'element_select';
  data: Record<string, unknown>;
  timestamp: Date;
  applied: boolean;
  appliedAt?: Date;
}

export interface ConflictResolution {
  conflictId: string;
  sessionId: string;
  updates: string[]; // Update IDs
  participants: string[]; // User IDs
  data: Record<string, unknown>;
  resolution?: 'accept' | 'reject' | 'merge';
  resolvedBy?: string;
  resolvedAt?: Date;
}

class CollaborationService {
  private db = databaseService.getClient();

  /**
   * Create a new collaboration session
   */
  async createSession(params: {
    formationId: string;
    userId: string;
    userName: string;
    metadata?: Record<string, unknown>;
  }): Promise<CollaborationSession> {
    try {
      const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const session: CollaborationSession = {
        id: sessionId,
        formationId: params.formationId,
        participants: [
          {
            userId: params.userId,
            userName: params.userName,
            role: 'owner',
            joinedAt: new Date(),
            lastSeen: new Date(),
          },
        ],
        startedAt: new Date(),
        lastActivity: new Date(),
        isActive: true,
        metadata: params.metadata,
      };

      // Store session in database using AppState table
      await this.db.appState.create({
        data: {
          userId: params.userId,
          stateType: `collaboration_session_${sessionId}`,
          stateData: session as any,
          version: 1,
        },
      });

      securityLogger.info('Collaboration session created', {
        sessionId,
        formationId: params.formationId,
        userId: params.userId,
      });

      return session;
    } catch (error) {
      securityLogger.error('Failed to create collaboration session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        formationId: params.formationId,
        userId: params.userId,
      });
      throw error;
    }
  }

  /**
   * Get session by ID from database
   */
  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    try {
      const record = await this.db.appState.findFirst({
        where: {
          stateType: `collaboration_session_${sessionId}`,
        },
      });

      if (!record) {
        return null;
      }

      const session = record.stateData as any as CollaborationSession;

      // Convert date strings back to Date objects
      session.startedAt = new Date(session.startedAt);
      session.lastActivity = new Date(session.lastActivity);
      session.participants = session.participants.map(p => ({
        ...p,
        joinedAt: new Date(p.joinedAt),
        lastSeen: new Date(p.lastSeen),
      }));

      return session;
    } catch (error) {
      securityLogger.error('Failed to get collaboration session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return null;
    }
  }

  /**
   * Update session in database
   */
  async updateSession(session: CollaborationSession): Promise<void> {
    try {
      await this.db.appState.updateMany({
        where: {
          stateType: `collaboration_session_${session.id}`,
        },
        data: {
          stateData: session as any,
          version: { increment: 1 },
        },
      });

      securityLogger.info('Collaboration session updated', {
        sessionId: session.id,
        participantCount: session.participants.length,
      });
    } catch (error) {
      securityLogger.error('Failed to update collaboration session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: session.id,
      });
      throw error;
    }
  }

  /**
   * Add participant to session
   */
  async addParticipant(
    sessionId: string,
    participant: {
      userId: string;
      userName: string;
      role: 'owner' | 'editor' | 'viewer';
      socketId?: string;
    }
  ): Promise<CollaborationSession | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Check if participant already exists
      const existingParticipant = session.participants.find(p => p.userId === participant.userId);
      if (existingParticipant) {
        // Update last seen and socket ID
        existingParticipant.lastSeen = new Date();
        existingParticipant.socketId = participant.socketId;
      } else {
        // Add new participant
        session.participants.push({
          userId: participant.userId,
          userName: participant.userName,
          role: participant.role,
          joinedAt: new Date(),
          lastSeen: new Date(),
          socketId: participant.socketId,
        });
      }

      session.lastActivity = new Date();
      await this.updateSession(session);

      securityLogger.info('Participant added to session', {
        sessionId,
        userId: participant.userId,
        role: participant.role,
      });

      return session;
    } catch (error) {
      securityLogger.error('Failed to add participant to session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId: participant.userId,
      });
      throw error;
    }
  }

  /**
   * Remove participant from session
   */
  async removeParticipant(sessionId: string, userId: string): Promise<CollaborationSession | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      session.participants = session.participants.filter(p => p.userId !== userId);
      session.lastActivity = new Date();

      // If no participants left, mark session as inactive
      if (session.participants.length === 0) {
        session.isActive = false;
      }

      await this.updateSession(session);

      securityLogger.info('Participant removed from session', {
        sessionId,
        userId,
        remainingParticipants: session.participants.length,
      });

      return session;
    } catch (error) {
      securityLogger.error('Failed to remove participant from session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update participant cursor position
   */
  async updateParticipantCursor(
    sessionId: string,
    userId: string,
    cursor: { x: number; y: number }
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.cursor = cursor;
        participant.lastSeen = new Date();
        session.lastActivity = new Date();
        await this.updateSession(session);
      }
    } catch (error) {
      securityLogger.error('Failed to update participant cursor', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId,
      });
    }
  }

  /**
   * Save real-time update to database
   */
  async saveUpdate(update: RealTimeUpdate): Promise<void> {
    try {
      await this.db.appState.create({
        data: {
          userId: update.userId,
          stateType: `collaboration_update_${update.sessionId}_${update.id}`,
          stateData: update as any,
          version: 1,
        },
      });

      securityLogger.info('Collaboration update saved', {
        updateId: update.id,
        sessionId: update.sessionId,
        type: update.type,
        userId: update.userId,
      });
    } catch (error) {
      securityLogger.error('Failed to save collaboration update', {
        error: error instanceof Error ? error.message : 'Unknown error',
        updateId: update.id,
        sessionId: update.sessionId,
      });
      throw error;
    }
  }

  /**
   * Get updates for a session
   */
  async getSessionUpdates(sessionId: string, limit = 100): Promise<RealTimeUpdate[]> {
    try {
      const records = await this.db.appState.findMany({
        where: {
          stateType: {
            startsWith: `collaboration_update_${sessionId}_`,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      const updates = records.map(record => {
        const update = record.stateData as any as RealTimeUpdate;
        update.timestamp = new Date(update.timestamp);
        if (update.appliedAt) {
          update.appliedAt = new Date(update.appliedAt);
        }
        return update;
      });

      return updates;
    } catch (error) {
      securityLogger.error('Failed to get session updates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return [];
    }
  }

  /**
   * Mark update as applied
   */
  async markUpdateApplied(updateId: string, sessionId: string): Promise<void> {
    try {
      const record = await this.db.appState.findFirst({
        where: { stateType: `collaboration_update_${sessionId}_${updateId}` },
      });

      if (record) {
        const update = record.stateData as any as RealTimeUpdate;
        update.applied = true;
        update.appliedAt = new Date();

        await this.db.appState.update({
          where: { id: record.id },
          data: {
            stateData: update as any,
            version: { increment: 1 },
          },
        });

        securityLogger.info('Update marked as applied', {
          updateId,
          sessionId,
        });
      }
    } catch (error) {
      securityLogger.error('Failed to mark update as applied', {
        error: error instanceof Error ? error.message : 'Unknown error',
        updateId,
        sessionId,
      });
    }
  }

  /**
   * Save conflict resolution
   */
  async saveConflict(conflict: ConflictResolution): Promise<void> {
    try {
      await this.db.appState.create({
        data: {
          userId: conflict.participants[0] || 'system',
          stateType: `collaboration_conflict_${conflict.sessionId}_${conflict.conflictId}`,
          stateData: conflict as any, // Prisma InputJsonValue requires any
          version: 1,
        },
      });

      securityLogger.info('Collaboration conflict saved', {
        conflictId: conflict.conflictId,
        sessionId: conflict.sessionId,
        participants: conflict.participants.length,
      });
    } catch (error) {
      securityLogger.error('Failed to save collaboration conflict', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conflictId: conflict.conflictId,
        sessionId: conflict.sessionId,
      });
      throw error;
    }
  }

  /**
   * Get session conflicts
   */
  async getSessionConflicts(sessionId: string): Promise<ConflictResolution[]> {
    try {
      const records = await this.db.appState.findMany({
        where: {
          stateType: {
            startsWith: `collaboration_conflict_${sessionId}_`,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const conflicts = records.map(record => {
        const conflict = record.stateData as unknown as ConflictResolution;
        if (conflict.resolvedAt) {
          conflict.resolvedAt = new Date(conflict.resolvedAt);
        }
        return conflict;
      });

      return conflicts;
    } catch (error) {
      securityLogger.error('Failed to get session conflicts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return [];
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: string,
    sessionId: string,
    resolution: 'accept' | 'reject' | 'merge',
    resolvedBy: string
  ): Promise<void> {
    try {
      const record = await this.db.appState.findFirst({
        where: { stateType: `collaboration_conflict_${sessionId}_${conflictId}` },
      });

      if (record) {
        const conflict = record.stateData as unknown as ConflictResolution;
        conflict.resolution = resolution;
        conflict.resolvedBy = resolvedBy;
        conflict.resolvedAt = new Date();

        await this.db.appState.update({
          where: { id: record.id },
          data: {
            stateData: conflict as any, // Prisma InputJsonValue requires any
            version: { increment: 1 },
          },
        });

        securityLogger.info('Conflict resolved', {
          conflictId,
          sessionId,
          resolution,
          resolvedBy,
        });
      }
    } catch (error) {
      securityLogger.error('Failed to resolve conflict', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conflictId,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get active sessions for a formation
   */
  async getActiveSessionsForFormation(formationId: string): Promise<CollaborationSession[]> {
    try {
      const records = await this.db.appState.findMany({
        where: {
          stateType: {
            startsWith: 'collaboration_session_',
          },
        },
      });

      const sessions = records
        .map(record => {
          const session = record.stateData as unknown as CollaborationSession;
          session.startedAt = new Date(session.startedAt);
          session.lastActivity = new Date(session.lastActivity);
          session.participants = session.participants.map(p => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
            lastSeen: new Date(p.lastSeen),
          }));
          return session;
        })
        .filter(session => session.formationId === formationId && session.isActive);

      return sessions;
    } catch (error) {
      securityLogger.error('Failed to get active sessions for formation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        formationId,
      });
      return [];
    }
  }

  /**
   * End session
   */
  async endSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return;
      }

      session.isActive = false;
      session.lastActivity = new Date();
      await this.updateSession(session);

      securityLogger.info('Collaboration session ended', {
        sessionId,
        reason: reason || 'Manual termination',
        duration: Date.now() - session.startedAt.getTime(),
        totalUpdates: session.participants.length,
      });
    } catch (error) {
      securityLogger.error('Failed to end collaboration session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Clean up old inactive sessions
   */
  async cleanupInactiveSessions(maxAgeHours = 24): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      const records = await this.db.appState.findMany({
        where: {
          stateType: {
            startsWith: 'collaboration_session_',
          },
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      const inactiveSessions = records.filter(record => {
        const session = record.stateData as unknown as CollaborationSession;
        return !session.isActive || new Date(session.lastActivity) < cutoffDate;
      });

      // Delete inactive sessions
      await this.db.appState.deleteMany({
        where: {
          id: {
            in: inactiveSessions.map(r => r.id),
          },
        },
      });

      securityLogger.info('Inactive sessions cleaned up', {
        count: inactiveSessions.length,
        maxAgeHours,
      });

      return inactiveSessions.length;
    } catch (error) {
      securityLogger.error('Failed to cleanup inactive sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(sessionId: string): Promise<{
    totalUpdates: number;
    updatesByType: Record<string, number>;
    totalConflicts: number;
    resolvedConflicts: number;
    participantActivity: Array<{ userId: string; updateCount: number }>;
  }> {
    try {
      const updates = await this.getSessionUpdates(sessionId, 1000);
      const conflicts = await this.getSessionConflicts(sessionId);

      const updatesByType: Record<string, number> = {};
      const participantUpdates: Record<string, number> = {};

      updates.forEach(update => {
        updatesByType[update.type] = (updatesByType[update.type] || 0) + 1;
        participantUpdates[update.userId] = (participantUpdates[update.userId] || 0) + 1;
      });

      const participantActivity = Object.entries(participantUpdates).map(([userId, count]) => ({
        userId,
        updateCount: count,
      }));

      return {
        totalUpdates: updates.length,
        updatesByType,
        totalConflicts: conflicts.length,
        resolvedConflicts: conflicts.filter(c => c.resolution).length,
        participantActivity,
      };
    } catch (error) {
      securityLogger.error('Failed to get session statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return {
        totalUpdates: 0,
        updatesByType: {},
        totalConflicts: 0,
        resolvedConflicts: 0,
        participantActivity: [],
      };
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;
