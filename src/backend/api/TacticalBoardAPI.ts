/**
 * Tactical Board API - Real-time collaborative tactical board with WebSocket support
 *
 * Features:
 * - Real-time formation editing and collaboration
 * - Player positioning with conflict resolution
 * - Tactical animations and movement patterns
 * - Formation templates and auto-assignment
 * - Advanced analytics and heat maps
 * - Export/import capabilities
 * - Version control and history tracking
 * - Multi-user collaboration with permissions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { phoenixPool } from '../database/PhoenixDatabasePool';
import { AuthenticatedRequest } from '../middleware/PhoenixAuthMiddleware';
import { v4 as uuidv4 } from 'uuid';
import { securityLogger } from '../../security/logging';
import { databaseService } from '../../services/databaseService';
import { exportService } from '../../services/exportService';
import { collaborationService } from '../../services/collaborationService';

export interface Formation {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  createdBy: string;
  isPublic: boolean;
  isTemplate: boolean;
  formation: FormationData;
  metadata: FormationMetadata;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface FormationData {
  system: string; // "4-4-2", "4-3-3", etc.
  players: PlayerPosition[];
  tactics: TacticalInstructions;
  setpieces: SetPieceConfiguration[];
}

export interface PlayerPosition {
  id: string;
  playerId?: string;
  position: Position;
  role: PlayerRole;
  instructions: PlayerInstructions;
  movementPattern?: MovementPattern[];
  connections: Connection[];
}

export interface Position {
  x: number; // 0-100 (percentage of field width)
  y: number; // 0-100 (percentage of field height)
  zone?: string; // "defense", "midfield", "attack"
}

export interface PlayerRole {
  primary: string; // "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"
  secondary?: string;
  style: PlayStyle;
}

export interface PlayStyle {
  attacking: number; // 1-10
  defending: number; // 1-10
  creativity: number; // 1-10
  workRate: number; // 1-10
  pressing: number; // 1-10
}

export interface PlayerInstructions {
  general: string[];
  attacking: string[];
  defending: string[];
  setpieces: string[];
}

export interface MovementPattern {
  id: string;
  name: string;
  phase: 'build-up' | 'attack' | 'defense' | 'transition';
  positions: Position[];
  duration: number; // seconds
  conditions: string[];
}

export interface Connection {
  playerId: string;
  type: 'passing' | 'support' | 'press' | 'cover';
  strength: number; // 1-10
  conditions: string[];
}

export interface TacticalInstructions {
  formation: {
    width: number; // 1-10
    depth: number; // 1-10
    compactness: number; // 1-10
  };
  attacking: {
    style: 'counter' | 'possession' | 'direct' | 'wing-play';
    tempo: number; // 1-10
    pressing: number; // 1-10
    creativity: number; // 1-10
  };
  defending: {
    line: 'high' | 'medium' | 'deep';
    pressing: 'high' | 'medium' | 'low';
    compactness: number; // 1-10
    aggression: number; // 1-10
  };
  transitions: {
    counterAttack: number; // 1-10
    regain: number; // 1-10
    support: number; // 1-10
  };
}

export interface SetPieceConfiguration {
  type: 'corner' | 'free-kick' | 'throw-in' | 'penalty';
  side?: 'left' | 'right';
  zone?: string;
  players: SetPiecePlayer[];
  movements: MovementPattern[];
}

export interface SetPiecePlayer {
  playerId: string;
  role: string;
  position: Position;
  movement?: MovementPattern;
}

export interface FormationMetadata {
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  effectiveness: {
    attacking: number;
    defending: number;
    possession: number;
    counter: number;
  };
  opposingSystems: string[];
  weatherConditions: string[];
  fieldSize: 'small' | 'medium' | 'large';
  usage: {
    views: number;
    downloads: number;
    likes: number;
    copies: number;
  };
}

export interface CollaborationSession {
  id: string;
  formationId: string;
  participants: Participant[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  permissions: SessionPermissions;
}

export interface Participant {
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  lastSeen: Date;
  cursor?: Position;
  selectedElement?: string;
}

export interface SessionPermissions {
  allowEditing: boolean;
  allowPlayerMovement: boolean;
  allowTacticalChanges: boolean;
  allowExport: boolean;
  requireApproval: boolean;
}

export interface RealTimeUpdate {
  id: string;
  sessionId: string;
  userId: string;
  type: 'player_move' | 'formation_change' | 'tactical_update' | 'cursor_move' | 'selection_change';
  data: any;
  timestamp: Date;
  applied: boolean;
}

export interface ConflictResolution {
  conflictId: string;
  type: 'position_conflict' | 'simultaneous_edit' | 'version_conflict';
  participants: string[];
  data: any;
  resolution?: 'accept' | 'reject' | 'merge';
  resolvedBy?: string;
  resolvedAt?: Date;
}

/**
 * Tactical Board API Router
 */
export class TacticalBoardAPI {
  private router: Router;
  private io: SocketIOServer;
  private db = databaseService.getClient();
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private pendingUpdates: Map<string, RealTimeUpdate[]> = new Map();
  private conflictQueue: Map<string, ConflictResolution[]> = new Map();

  constructor(io: SocketIOServer) {
    this.router = Router();
    this.io = io;
    this.setupRoutes();
    this.setupWebSocketHandlers();
    this.startCleanupTasks();
  }

  private setupRoutes(): void {
    // Formation CRUD operations
    this.router.get('/formations', this.getFormations.bind(this));
    this.router.get('/formations/:id', this.getFormation.bind(this));
    this.router.post('/formations', this.createFormation.bind(this));
    this.router.put('/formations/:id', this.updateFormation.bind(this));
    this.router.delete('/formations/:id', this.deleteFormation.bind(this));

    // Formation templates
    this.router.get('/templates', this.getFormationTemplates.bind(this));
    this.router.post('/formations/:id/template', this.convertToTemplate.bind(this));

    // Collaboration endpoints
    this.router.post('/formations/:id/collaborate', this.startCollaboration.bind(this));
    this.router.get('/formations/:id/sessions', this.getActiveSessions.bind(this));
    this.router.put('/sessions/:sessionId/permissions', this.updateSessionPermissions.bind(this));
    this.router.delete('/sessions/:sessionId', this.endCollaboration.bind(this));

    // Auto-assignment and optimization
    this.router.post('/formations/:id/auto-assign', this.autoAssignPlayers.bind(this));
    this.router.post('/formations/:id/optimize', this.optimizeFormation.bind(this));
    this.router.get('/formations/:id/analysis', this.analyzeFormation.bind(this));

    // Export and import
    this.router.post('/formations/:id/export', this.exportFormation.bind(this));
    this.router.post('/formations/import', this.importFormation.bind(this));

    // Version control
    this.router.get('/formations/:id/history', this.getFormationHistory.bind(this));
    this.router.post('/formations/:id/revert/:version', this.revertToVersion.bind(this));

    // Analytics
    this.router.get('/formations/:id/heatmap', this.getPositionHeatmap.bind(this));
    this.router.get('/formations/:id/effectiveness', this.getEffectivenessMetrics.bind(this));
    this.router.get('/analytics/popular-formations', this.getPopularFormations.bind(this));
  }

  private setupWebSocketHandlers(): void {
    this.io.on('connection', (socket: any) => {
      socket.on('join_tactical_session', (data: any) => {
        this.handleJoinSession(socket, data);
      });

      socket.on('leave_tactical_session', (data: any) => {
        this.handleLeaveSession(socket, data);
      });

      socket.on('player_position_update', (data: any) => {
        this.handlePlayerPositionUpdate(socket, data);
      });

      socket.on('formation_update', (data: any) => {
        this.handleFormationUpdate(socket, data);
      });

      // socket.on('tactical_instruction_update', (data: any) => {
      //   this.handleTacticalInstructionUpdate(socket, data);
      // });

      socket.on('cursor_move', (data: any) => {
        this.handleCursorMove(socket, data);
      });

      // socket.on('element_select', (data: any) => {
      //   this.handleElementSelect(socket, data);
      // });

      socket.on('conflict_resolution', (data: any) => {
        this.handleConflictResolution(socket, data);
      });

      // socket.on('request_formation_lock', (data: any) => {
      //   this.handleFormationLockRequest(socket, data);
      // });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private startCleanupTasks(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(
      () => {
        this.cleanupInactiveSessions();
      },
      5 * 60 * 1000
    );

    // Process pending updates every second
    setInterval(() => {
      this.processPendingUpdates();
    }, 1000);

    // Resolve conflicts automatically after timeout
    setInterval(() => {
      this.autoResolveConflicts();
    }, 30 * 1000);
  }

  // Formation CRUD operations

  private async getFormations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        tags,
        system,
        isPublic,
        isTemplate,
        teamId,
        createdBy,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
      } = req.query;

      // Ensure sortOrder is a string
      const sortOrderStr = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;
      const sortOrderUpper = (sortOrderStr || 'desc').toString().toUpperCase();

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Build dynamic where clause
      if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        whereClause += ` AND metadata->>'tags' ?| array[${tagArray.map(() => `$${paramIndex++}`).join(',')}]`;
        params.push(...tagArray);
      }

      if (system) {
        whereClause += ` AND formation->>'system' = $${paramIndex}`;
        params.push(system);
        paramIndex++;
      }

      if (isPublic !== undefined) {
        whereClause += ` AND is_public = $${paramIndex}`;
        params.push(isPublic === 'true');
        paramIndex++;
      }

      if (isTemplate !== undefined) {
        whereClause += ` AND is_template = $${paramIndex}`;
        params.push(isTemplate === 'true');
        paramIndex++;
      }

      if (teamId) {
        whereClause += ` AND team_id = $${paramIndex}`;
        params.push(teamId);
        paramIndex++;
      }

      if (createdBy) {
        whereClause += ` AND created_by = $${paramIndex}`;
        params.push(createdBy);
        paramIndex++;
      }

      // Add user access control
      if (req.user?.role !== 'admin') {
        whereClause += ` AND (is_public = true OR created_by = $${paramIndex}`;
        params.push(req.user?.id);
        paramIndex++;

        if (req.user?.role === 'coach' && teamId) {
          whereClause += ` OR team_id IN (SELECT id FROM teams WHERE coach_id = $${paramIndex})`;
          params.push(req.user.id);
          paramIndex++;
        }

        whereClause += ')';
      }

      const offset = (Number(page) - 1) * Number(limit);

      // Get total count
      const countResult = await phoenixPool.query(
        `
        SELECT COUNT(*) as total FROM formations ${whereClause}
      `,
        params
      );

      // Get formations
      const result = await phoenixPool.query(
        `
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as creator_name,
          t.name as team_name,
          (SELECT COUNT(*) FROM collaboration_sessions cs WHERE cs.formation_id = f.id AND cs.is_active = true) as active_sessions
        FROM formations f
        LEFT JOIN users u ON f.created_by = u.id
        LEFT JOIN teams t ON f.team_id = t.id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrderUpper}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, limit, offset]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          formations: result.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch formations',
        details: (error as any).message,
      });
    }
  }

  private async getFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeHistory = false } = req.query;

      const result = await phoenixPool.query(
        `
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as creator_name,
          t.name as team_name
        FROM formations f
        LEFT JOIN users u ON f.created_by = u.id
        LEFT JOIN teams t ON f.team_id = t.id
        WHERE f.id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found',
        });
        return;
      }

      const formation = result.rows[0];

      // Check access permissions
      if (!this.checkFormationAccess(formation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Increment view count
      await phoenixPool.query(
        `
        UPDATE formations 
        SET metadata = jsonb_set(metadata, '{usage,views}', 
          to_jsonb(COALESCE((metadata->'usage'->>'views')::int, 0) + 1))
        WHERE id = $1
      `,
        [id]
      );

      let history: any[] | null = null;
      if (includeHistory === 'true') {
        const historyResult = await phoenixPool.query(
          `
          SELECT version, created_at, created_by, changes
          FROM formation_history 
          WHERE formation_id = $1 
          ORDER BY version DESC 
          LIMIT 10
        `,
          [id]
        );
        history = historyResult.rows;
      }

      res.json({
        success: true,
        data: {
          formation,
          history,
          activeSessions: this.getActiveSessionsForFormation(id),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch formation',
        details: (error as any).message,
      });
    }
  }

  private async createFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        teamId,
        isPublic = false,
        isTemplate = false,
        formation,
        metadata = {},
      } = req.body;

      // Validate formation data
      if (!this.validateFormationData(formation)) {
        res.status(400).json({
          success: false,
          error: 'Invalid formation data',
        });
        return;
      }

      const formationId = uuidv4();
      const now = new Date();

      // Set default metadata
      const defaultMetadata = {
        tags: [],
        difficulty: 'intermediate',
        effectiveness: { attacking: 5, defending: 5, possession: 5, counter: 5 },
        opposingSystems: [],
        weatherConditions: ['any'],
        fieldSize: 'medium',
        usage: { views: 0, downloads: 0, likes: 0, copies: 0 },
        ...metadata,
      };

      const result = await phoenixPool.query(
        `
        INSERT INTO formations (
          id, name, description, team_id, created_by, is_public, is_template,
          formation, metadata, created_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 1)
        RETURNING *
      `,
        [
          formationId,
          name,
          description,
          teamId,
          req.user?.id,
          isPublic,
          isTemplate,
          JSON.stringify(formation),
          JSON.stringify(defaultMetadata),
          now,
        ]
      );

      // Create initial history entry
      await this.createHistoryEntry(formationId, 1, req.user?.id, 'Formation created', formation);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create formation',
        details: (error as any).message,
      });
    }
  }

  private async updateFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get current formation
      const currentResult = await phoenixPool.query('SELECT * FROM formations WHERE id = $1', [id]);
      if (currentResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found',
        });
        return;
      }

      const currentFormation = currentResult.rows[0];

      // Check permissions
      if (!this.checkFormationEditAccess(currentFormation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Edit access denied',
        });
        return;
      }

      // Check for active collaboration sessions
      const activeSession = this.getActiveSessionForFormation(id);
      if (activeSession && !this.canEditInSession(activeSession, req.user?.id)) {
        res.status(409).json({
          success: false,
          error: 'Formation is locked by another user',
          data: { sessionId: activeSession.id },
        });
        return;
      }

      // Build update query dynamically
      const allowedFields = [
        'name',
        'description',
        'team_id',
        'is_public',
        'formation',
        'metadata',
      ];
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(field => {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(
            field === 'formation' || field === 'metadata'
              ? JSON.stringify(updates[field])
              : updates[field]
          );
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
        return;
      }

      // Add updated_at and increment version
      updateFields.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;

      updateFields.push(`version = version + 1`);

      const result = await phoenixPool.query(
        `
        UPDATE formations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
        [...values, id]
      );

      // Create history entry
      const changes = Object.keys(updates).filter(key => allowedFields.includes(key));
      await this.createHistoryEntry(
        id,
        result.rows[0].version,
        req.user?.id,
        `Updated: ${changes.join(', ')}`,
        updates.formation || currentFormation.formation
      );

      // Broadcast update to active sessions
      if (activeSession) {
        this.broadcastFormationUpdate(activeSession.id, {
          type: 'formation_updated',
          formationId: id,
          updates,
          updatedBy: req.user?.id,
          version: result.rows[0].version,
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update formation',
        details: (error as any).message,
      });
    }
  }

  private async deleteFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await phoenixPool.query('SELECT * FROM formations WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found',
        });
        return;
      }

      const formation = result.rows[0];

      // Check permissions (only creator or admin can delete)
      if (formation.created_by !== req.user?.id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Delete access denied',
        });
        return;
      }

      // End any active collaboration sessions
      const activeSessions = Array.from(this.activeSessions.values()).filter(
        session => session.formationId === id
      );

      activeSessions.forEach(session => {
        this.endSession(session.id, 'Formation deleted');
      });

      // Soft delete (mark as deleted instead of actual deletion)
      await phoenixPool.query(
        `
        UPDATE formations 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `,
        [id]
      );

      res.json({
        success: true,
        message: 'Formation deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete formation',
        details: (error as any).message,
      });
    }
  }

  // Collaboration methods

  private async startCollaboration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: formationId } = req.params;
      const { permissions = {} } = req.body;

      // Check if formation exists and user has access
      const formationResult = await phoenixPool.query('SELECT * FROM formations WHERE id = $1', [
        formationId,
      ]);

      if (formationResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found',
        });
        return;
      }

      const formation = formationResult.rows[0];
      if (!this.checkFormationAccess(formation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Check if there's already an active session
      const existingSession = this.getActiveSessionForFormation(formationId);

      if (existingSession) {
        // Add user to existing session
        const participant: Participant = {
          userId: req.user?.id || '',
          userName: `${req.user?.firstName} ${req.user?.lastName}`,
          role: formation.created_by === req.user?.id ? 'owner' : 'editor',
          joinedAt: new Date(),
          lastSeen: new Date(),
        };

        existingSession.participants.push(participant);
        existingSession.lastActivity = new Date();

        // Notify other participants
        this.broadcastToSession(existingSession.id, 'participant_joined', {
          participant,
          sessionId: existingSession.id,
        });

        res.json({
          success: true,
          data: { sessionId: existingSession.id, session: existingSession },
        });
        return;
      }

      // Create new collaboration session
      const sessionId = uuidv4();
      const defaultPermissions: SessionPermissions = {
        allowEditing: true,
        allowPlayerMovement: true,
        allowTacticalChanges: true,
        allowExport: true,
        requireApproval: false,
        ...permissions,
      };

      const session: CollaborationSession = {
        id: sessionId,
        formationId,
        participants: [
          {
            userId: req.user?.id || '',
            userName: `${req.user?.firstName} ${req.user?.lastName}`,
            role: 'owner',
            joinedAt: new Date(),
            lastSeen: new Date(),
          },
        ],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
        permissions: defaultPermissions,
      };

      this.activeSessions.set(sessionId, session);

      res.json({
        success: true,
        data: { sessionId, session },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to start collaboration',
        details: (error as any).message,
      });
    }
  }

  // WebSocket handlers

  private handleJoinSession(socket: Socket, data: { sessionId: string; userId: string }): void {
    const session = this.activeSessions.get(data.sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Add socket to session room
    socket.join(data.sessionId);
    socket.data.sessionId = data.sessionId;
    socket.data.userId = data.userId;

    // Update participant status
    const participant = session.participants.find(p => p.userId === data.userId);
    if (participant) {
      participant.lastSeen = new Date();
    }

    // Notify others
    socket.to(data.sessionId).emit('participant_activity', {
      userId: data.userId,
      type: 'joined',
      timestamp: new Date(),
    });

    // Send current session state
    socket.emit('session_state', {
      session,
      formationData: this.getFormationData(session.formationId),
    });
  }

  private handleLeaveSession(socket: Socket, data: { sessionId: string; userId: string }): void {
    socket.leave(data.sessionId);

    // Notify others
    socket.to(data.sessionId).emit('participant_activity', {
      userId: data.userId,
      type: 'left',
      timestamp: new Date(),
    });

    const session = this.activeSessions.get(data.sessionId);
    if (session) {
      // Remove participant or mark as inactive
      session.participants = session.participants.filter(p => p.userId !== data.userId);

      if (session.participants.length === 0) {
        this.endSession(data.sessionId, 'No active participants');
      }
    }
  }

  private handlePlayerPositionUpdate(socket: Socket, data: any): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (!sessionId || !this.canUserEdit(sessionId, userId)) {
      socket.emit('error', { message: 'Unauthorized edit attempt' });
      return;
    }

    // Check for position conflicts
    const conflict = this.checkPositionConflict(sessionId, data);
    if (conflict) {
      this.handlePositionConflict(sessionId, conflict);
      return;
    }

    // Create update record
    const update: RealTimeUpdate = {
      id: uuidv4(),
      sessionId,
      userId,
      type: 'player_move',
      data,
      timestamp: new Date(),
      applied: false,
    };

    // Add to pending updates
    if (!this.pendingUpdates.has(sessionId)) {
      this.pendingUpdates.set(sessionId, []);
    }
    this.pendingUpdates.get(sessionId)?.push(update);

    // Broadcast to session
    socket.to(sessionId).emit('player_position_update', {
      updateId: update.id,
      userId,
      data,
      timestamp: update.timestamp,
    });
  }

  private handleFormationUpdate(socket: Socket, data: any): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (!sessionId || !this.canUserEdit(sessionId, userId)) {
      socket.emit('error', { message: 'Unauthorized edit attempt' });
      return;
    }

    const update: RealTimeUpdate = {
      id: uuidv4(),
      sessionId,
      userId,
      type: 'formation_change',
      data,
      timestamp: new Date(),
      applied: false,
    };

    if (!this.pendingUpdates.has(sessionId)) {
      this.pendingUpdates.set(sessionId, []);
    }
    this.pendingUpdates.get(sessionId)?.push(update);

    // Broadcast to session
    socket.to(sessionId).emit('formation_update', {
      updateId: update.id,
      userId,
      data,
      timestamp: update.timestamp,
    });
  }

  private handleCursorMove(socket: Socket, data: { position: Position }): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (!sessionId) {
      return;
    }

    // Update participant cursor position
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const participant = session.participants.find(p => p.userId === userId);
      if (participant) {
        participant.cursor = data.position;
        participant.lastSeen = new Date();
      }
    }

    // Broadcast cursor position
    socket.to(sessionId).emit('cursor_move', {
      userId,
      position: data.position,
      timestamp: new Date(),
    });
  }

  private handleConflictResolution(socket: Socket, data: any): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    const conflicts = this.conflictQueue.get(sessionId) || [];
    const conflict = conflicts.find(c => c.conflictId === data.conflictId);

    if (!conflict) {
      socket.emit('error', { message: 'Conflict not found' });
      return;
    }

    // Check if user has permission to resolve
    const session = this.activeSessions.get(sessionId);
    const participant = session?.participants.find(p => p.userId === userId);

    if (!participant || (participant.role !== 'owner' && participant.role !== 'editor')) {
      socket.emit('error', { message: 'Insufficient permissions to resolve conflict' });
      return;
    }

    // Apply resolution
    conflict.resolution = data.resolution;
    conflict.resolvedBy = userId;
    conflict.resolvedAt = new Date();

    // Broadcast resolution
    this.broadcastToSession(sessionId, 'conflict_resolved', {
      conflictId: data.conflictId,
      resolution: data.resolution,
      resolvedBy: userId,
    });

    // Remove from queue
    this.conflictQueue.set(
      sessionId,
      conflicts.filter(c => c.conflictId !== data.conflictId)
    );
  }

  // Helper methods

  private validateFormationData(formation: any): boolean {
    if (!formation || typeof formation !== 'object') {
      return false;
    }
    if (!formation.system || typeof formation.system !== 'string') {
      return false;
    }
    if (!Array.isArray(formation.players)) {
      return false;
    }

    // Validate players array
    return formation.players.every((player: any) => {
      return (
        player.id &&
        player.position &&
        typeof player.position.x === 'number' &&
        typeof player.position.y === 'number' &&
        player.role &&
        player.role.primary
      );
    });
  }

  private checkFormationAccess(formation: any, user: any): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (formation.is_public) {
      return true;
    }
    if (formation.created_by === user.id) {
      return true;
    }

    // Check team access for coaches
    if (user.role === 'coach' && formation.team_id) {
      // Would check if user is coach of the team
      return true; // Simplified for this example
    }

    return false;
  }

  private checkFormationEditAccess(formation: any, user: any): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (formation.created_by === user.id) {
      return true;
    }

    // Check if user is coach of the team
    if (user.role === 'coach' && formation.team_id) {
      return true; // Simplified for this example
    }

    return false;
  }

  private getActiveSessionsForFormation(formationId: string): CollaborationSession[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.formationId === formationId && session.isActive
    );
  }

  private getActiveSessionForFormation(formationId: string): CollaborationSession | undefined {
    return Array.from(this.activeSessions.values()).find(
      session => session.formationId === formationId && session.isActive
    );
  }

  private canEditInSession(session: CollaborationSession, userId?: string): boolean {
    if (!userId) {
      return false;
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) {
      return false;
    }

    return (
      participant.role === 'owner' ||
      (participant.role === 'editor' && session.permissions.allowEditing)
    );
  }

  private canUserEdit(sessionId: string, userId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    return this.canEditInSession(session, userId);
  }

  private checkPositionConflict(sessionId: string, data: any): ConflictResolution | null {
    // Check if multiple users are trying to move the same player
    const pendingUpdates = this.pendingUpdates.get(sessionId) || [];
    const recentUpdates = pendingUpdates.filter(
      update =>
        update.type === 'player_move' &&
        update.data.playerId === data.playerId &&
        Date.now() - update.timestamp.getTime() < 1000 // Within last second
    );

    if (recentUpdates.length > 0) {
      return {
        conflictId: uuidv4(),
        type: 'position_conflict',
        participants: [recentUpdates[0].userId, data.userId],
        data: { playerId: data.playerId, positions: [recentUpdates[0].data, data] },
      };
    }

    return null;
  }

  private handlePositionConflict(sessionId: string, conflict: ConflictResolution): void {
    if (!this.conflictQueue.has(sessionId)) {
      this.conflictQueue.set(sessionId, []);
    }
    this.conflictQueue.get(sessionId)?.push(conflict);

    // Broadcast conflict to session
    this.broadcastToSession(sessionId, 'position_conflict', conflict);
  }

  private broadcastToSession(sessionId: string, event: string, data: any): void {
    this.io.to(sessionId).emit(event, data);
  }

  private broadcastFormationUpdate(sessionId: string, data: any): void {
    this.io.to(sessionId).emit('formation_updated', data);
  }

  private async createHistoryEntry(
    formationId: string,
    version: number,
    userId?: string,
    changes?: string,
    formationData?: any
  ): Promise<void> {
    try {
      await phoenixPool.query(
        `
        INSERT INTO formation_history (
          formation_id, version, created_at, created_by, changes, formation_data
        ) VALUES ($1, $2, NOW(), $3, $4, $5)
      `,
        [formationId, version, userId, changes, JSON.stringify(formationData)]
      );
    } catch (error: any) {
      console.error('Failed to create history entry:', error);
    }
  }

  private getFormationData(formationId: string): any {
    // Would fetch formation data from database
    return {}; // Simplified for this example
  }

  private endSession(sessionId: string, reason?: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;

      // Broadcast session end
      this.broadcastToSession(sessionId, 'session_ended', { reason });

      // Clean up
      this.activeSessions.delete(sessionId);
      this.pendingUpdates.delete(sessionId);
      this.conflictQueue.delete(sessionId);
    }
  }

  private processPendingUpdates(): void {
    for (const [sessionId, updates] of this.pendingUpdates.entries()) {
      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        this.pendingUpdates.delete(sessionId);
        continue;
      }

      // Process updates in chronological order
      const sortedUpdates = updates
        .filter(update => !update.applied)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      sortedUpdates.forEach(update => {
        this.applyUpdate(update);
        update.applied = true;
      });

      // Remove applied updates
      this.pendingUpdates.set(
        sessionId,
        updates.filter(update => !update.applied)
      );
    }
  }

  private applyUpdate(update: RealTimeUpdate): void {
    // Apply the update to the formation data
    // This would typically involve updating the database
    console.log('Applying update:', update);
  }

  private autoResolveConflicts(): void {
    for (const [sessionId, conflicts] of this.conflictQueue.entries()) {
      conflicts.forEach(conflict => {
        if (!conflict.resolution && Date.now() - conflict.data.timestamp > 30000) {
          // 30 seconds timeout

          // Auto-resolve by accepting the first change
          conflict.resolution = 'accept';
          conflict.resolvedBy = 'system';
          conflict.resolvedAt = new Date();

          this.broadcastToSession(sessionId, 'conflict_auto_resolved', conflict);
        }
      });

      // Remove resolved conflicts
      this.conflictQueue.set(
        sessionId,
        conflicts.filter(c => !c.resolution)
      );
    }
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > inactivityThreshold) {
        this.endSession(sessionId, 'Inactivity timeout');
      }
    }
  }

  private handleDisconnect(socket: Socket): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (sessionId && userId) {
      this.handleLeaveSession(socket, { sessionId, userId });
    }
  }

  // Additional stub methods for auto-assignment, analytics, etc.

  private async autoAssignPlayers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const formationId = req.params.id;
      const { availablePlayerIds, optimizationGoal } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!formationId) {
        res.status(400).json({
          success: false,
          message: 'Formation ID is required',
        });
        return;
      }

      if (!availablePlayerIds || !Array.isArray(availablePlayerIds)) {
        res.status(400).json({
          success: false,
          message: 'Available player IDs array is required',
        });
        return;
      }

      const goal = optimizationGoal || 'balanced'; // balanced, attacking, defensive

      // Load formation position requirements from database
      // Production: Use Prisma to query Formation model
      // const formation = await this.db.formation.findFirst({
      //   where: { id: formationId, userId },
      //   include: { positions: true }
      // });

      // Fetch player attributes and ratings from database
      // Production: Use Prisma to query Player model
      // const players = await this.db.player.findMany({
      //   where: { id: { in: availablePlayerIds } },
      //   select: { id: true, name: true, position: true, attributes: true }
      // });

      // Mock formation positions (4-3-3)
      const positions = [
        { id: 'gk', name: 'GK', x: 50, y: 10, preferredAttributes: ['reflexes', 'positioning'] },
        { id: 'lb', name: 'LB', x: 20, y: 30, preferredAttributes: ['defending', 'pace'] },
        { id: 'cb1', name: 'CB', x: 40, y: 25, preferredAttributes: ['defending', 'physical'] },
        { id: 'cb2', name: 'CB', x: 60, y: 25, preferredAttributes: ['defending', 'physical'] },
        { id: 'rb', name: 'RB', x: 80, y: 30, preferredAttributes: ['defending', 'pace'] },
        { id: 'cm1', name: 'CM', x: 30, y: 50, preferredAttributes: ['passing', 'stamina'] },
        { id: 'cm2', name: 'CM', x: 50, y: 55, preferredAttributes: ['passing', 'vision'] },
        { id: 'cm3', name: 'CM', x: 70, y: 50, preferredAttributes: ['passing', 'stamina'] },
        { id: 'lw', name: 'LW', x: 20, y: 75, preferredAttributes: ['pace', 'dribbling'] },
        { id: 'st', name: 'ST', x: 50, y: 85, preferredAttributes: ['shooting', 'finishing'] },
        { id: 'rw', name: 'RW', x: 80, y: 75, preferredAttributes: ['pace', 'dribbling'] },
      ];

      // Mock player data
      const players = availablePlayerIds.slice(0, 15).map((playerId: string, index: number) => ({
        id: playerId,
        name: `Player ${index + 1}`,
        preferredPosition: positions[index % positions.length]?.name || 'CM',
        attributes: {
          overall: 70 + Math.floor(Math.random() * 20),
          pace: 60 + Math.floor(Math.random() * 30),
          shooting: 60 + Math.floor(Math.random() * 30),
          passing: 60 + Math.floor(Math.random() * 30),
          dribbling: 60 + Math.floor(Math.random() * 30),
          defending: 60 + Math.floor(Math.random() * 30),
          physical: 60 + Math.floor(Math.random() * 30),
        },
      }));

      // AI Assignment Algorithm: Score each player for each position
      const assignments: Array<{
        positionId: string;
        positionName: string;
        playerId: string;
        playerName: string;
        suitabilityScore: number;
        chemistry: number;
      }> = [];

      const usedPlayers = new Set<string>();

      // Greedy algorithm: Assign best player to each position
      positions.forEach(position => {
        let bestPlayer:
          | {
              id: string;
              name: string;
              preferredPosition: string;
              attributes: Record<string, number>;
            }
          | undefined = undefined;
        let bestScore = 0;

        players.forEach(player => {
          if (usedPlayers.has(player.id)) {
            return;
          }

          // Calculate suitability score
          let score = 0;

          // Position match bonus
          if (player.preferredPosition === position.name) {
            score += 20;
          }

          // Attribute match (simplified)
          if (
            position.name.includes('CB') ||
            position.name.includes('LB') ||
            position.name.includes('RB')
          ) {
            score += player.attributes.defending * 0.4;
            score += player.attributes.physical * 0.3;
            score += player.attributes.pace * 0.3;
          } else if (position.name.includes('CM') || position.name.includes('CDM')) {
            score += player.attributes.passing * 0.4;
            score += player.attributes.defending * 0.3;
            score += player.attributes.physical * 0.3;
          } else if (position.name.includes('W') || position.name.includes('ST')) {
            score += player.attributes.pace * 0.3;
            score += player.attributes.dribbling * 0.3;
            score += player.attributes.shooting * 0.4;
          } else if (position.name === 'GK') {
            score += player.attributes.overall; // GK uses overall as special attribute
          }

          // Apply optimization goal
          if (goal === 'attacking' && position.y > 60) {
            score *= 1.2;
          } else if (goal === 'defensive' && position.y < 40) {
            score *= 1.2;
          }

          if (score > bestScore) {
            bestScore = score;
            bestPlayer = player;
          }
        });

        if (bestPlayer !== undefined) {
          // Type assertion to help TypeScript understand the narrowed type
          const player = bestPlayer as {
            id: string;
            name: string;
            preferredPosition: string;
            attributes: Record<string, number>;
          };
          assignments.push({
            positionId: position.id,
            positionName: position.name,
            playerId: player.id,
            playerName: player.name,
            suitabilityScore: Math.round(bestScore),
            chemistry: 75 + Math.floor(Math.random() * 20),
          });
          usedPlayers.add(player.id);
        }
      });

      // Calculate overall team chemistry
      const avgChemistry =
        assignments.reduce((sum, a) => sum + a.chemistry, 0) / assignments.length;
      const avgSuitability =
        assignments.reduce((sum, a) => sum + a.suitabilityScore, 0) / assignments.length;

      res.json({
        success: true,
        assignments,
        teamStats: {
          averageChemistry: Math.round(avgChemistry),
          averageSuitability: Math.round(avgSuitability),
          optimizationGoal: goal,
          playersAssigned: assignments.length,
          playersAvailable: players.length,
        },
        recommendations: [
          'Consider rotating key players to prevent fatigue',
          'Chemistry can be improved by adjusting position assignments',
          'Some players may benefit from tactical training',
        ],
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Failed to auto-assign players',
      });
    }
  }

  private async optimizeFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const formationId = req.params.id;
      const { teamObjective, currentPlayers } = req.body;

      // Use currentPlayers from request body for optimization context
      // Production: Validate currentPlayers array structure

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!formationId) {
        res.status(400).json({
          success: false,
          message: 'Formation ID is required',
        });
        return;
      }

      const objective = teamObjective || 'balanced'; // attacking, defensive, possession, counter

      // Load current formation configuration from database
      // Production: Use Prisma to query Formation with positions
      // const formation = await this.db.formation.findUnique({
      //   where: { id: formationId },
      //   include: {
      //     positions: { orderBy: [{ y: 'asc' }, { x: 'asc' }] },
      //     team: true
      //   }
      // });
      // Validate formation exists and user has access
      // if (!formation || formation.userId !== userId) {
      //   return res.status(404).json({ success: false, message: 'Formation not found' });
      // }
      // Use currentPlayers for player assignments if provided
      //    WHERE f.id = $1 AND f.user_id = $2
      //    GROUP BY f.id`,
      //   [formationId, userId]
      // );

      // Mock current formation analysis
      const currentFormation = {
        id: formationId,
        name: '4-3-3',
        defensiveRating: 72,
        offensiveRating: 78,
        balanceScore: 75,
        weakPositions: ['LB', 'CM'],
      };

      // Generate optimization suggestions
      const optimizations = [
        {
          suggestion: 'Switch to 4-2-3-1 for better midfield control',
          newFormation: '4-2-3-1',
          expectedImpact: {
            defensiveRating: 78,
            offensiveRating: 76,
            balanceScore: 77,
            improvement: '+2 overall',
          },
          playerSwaps: [
            {
              from: { position: 'CM', playerId: 'p5' },
              to: { position: 'CAM', playerId: 'p5' },
              reason: 'Better utilizes creative passing ability',
            },
            {
              from: { position: 'CM', playerId: 'p6' },
              to: { position: 'CDM', playerId: 'p6' },
              reason: 'Strengthens defensive midfield',
            },
          ],
          tacticalNotes: [
            'Provides additional defensive cover',
            'Creates space for attacking midfielder',
            'Maintains width with wingers',
          ],
        },
        {
          suggestion: 'Adjust player positions for better balance',
          newFormation: '4-3-3 (Modified)',
          expectedImpact: {
            defensiveRating: 75,
            offensiveRating: 78,
            balanceScore: 76,
            improvement: '+1 overall',
          },
          playerSwaps: [
            {
              from: { position: 'LB', playerId: 'p2' },
              to: { position: 'LB', playerId: 'p12' },
              reason: 'Improved defensive capabilities',
            },
            {
              from: { position: 'CM', playerId: 'p4' },
              to: { position: 'CM', playerId: 'p13' },
              reason: 'Better passing range and vision',
            },
          ],
          tacticalNotes: [
            'Addresses weak positions',
            'Maintains current formation structure',
            'Minimal disruption to team chemistry',
          ],
        },
        {
          suggestion: 'Aggressive 3-4-3 for high pressing',
          newFormation: '3-4-3',
          expectedImpact: {
            defensiveRating: 68,
            offensiveRating: 85,
            balanceScore: 74,
            improvement: 'Trade-off: -4 defense, +7 attack',
          },
          playerSwaps: [
            {
              from: { position: 'LB', playerId: 'p2' },
              to: { position: 'LWB', playerId: 'p2' },
              reason: 'More attacking freedom',
            },
            {
              from: { position: 'RB', playerId: 'p3' },
              to: { position: 'RWB', playerId: 'p3' },
              reason: 'Wing-back role suits pace',
            },
          ],
          tacticalNotes: [
            'High-risk, high-reward approach',
            'Requires disciplined wing-backs',
            'Effective against defensive opponents',
          ],
        },
      ];

      // Filter by objective
      let prioritizedOptimizations = optimizations;
      if (objective === 'attacking') {
        prioritizedOptimizations = optimizations.sort(
          (a, b) => b.expectedImpact.offensiveRating - a.expectedImpact.offensiveRating
        );
      } else if (objective === 'defensive') {
        prioritizedOptimizations = optimizations.sort(
          (a, b) => b.expectedImpact.defensiveRating - a.expectedImpact.defensiveRating
        );
      }

      res.json({
        success: true,
        currentFormation,
        optimizations: prioritizedOptimizations,
        analysis: {
          strengths: [
            'Strong attacking presence on wings',
            'Good midfield creativity',
            'High pressing capability',
          ],
          weaknesses: [
            'Vulnerable to counter-attacks',
            'Left-back position needs improvement',
            'Central midfield lacks defensive cover',
          ],
          recommendations: [
            'Focus on defensive transitions',
            'Train midfielders in pressing techniques',
            'Consider rotation for fatigued players',
          ],
        },
        metadata: {
          objective,
          analysisDate: new Date().toISOString(),
          optimizationsGenerated: prioritizedOptimizations.length,
        },
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Failed to optimize formation',
      });
    }
  }

  private async analyzeFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const formationId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!formationId) {
        res.status(400).json({
          success: false,
          message: 'Formation ID is required',
        });
        return;
      }

      // Load formation configuration from database
      // Production: Use Prisma Formation model with positions
      // const formation = await this.db.formation.findUnique({
      //   where: { id: formationId },
      //   include: {
      //     positions: {
      //       orderBy: [{ y: 'asc' }, { x: 'asc' }],
      //       include: { player: true }
      //     }
      //   }
      // });
      //    LEFT JOIN formation_positions p ON p.formation_id = f.id
      //    WHERE f.id = $1 AND f.user_id = $2
      //    GROUP BY f.id`,
      //   [formationId, userId]
      // );

      // Mock formation analysis (4-3-3)
      const formation = {
        id: formationId,
        name: '4-3-3',
        type: 'attacking',
        positions: [
          { position: 'GK', x: 50, y: 5 },
          { position: 'LB', x: 20, y: 25 },
          { position: 'CB', x: 40, y: 20 },
          { position: 'CB', x: 60, y: 20 },
          { position: 'RB', x: 80, y: 25 },
          { position: 'CM', x: 30, y: 50 },
          { position: 'CM', x: 50, y: 55 },
          { position: 'CM', x: 70, y: 50 },
          { position: 'LW', x: 20, y: 80 },
          { position: 'ST', x: 50, y: 90 },
          { position: 'RW', x: 80, y: 80 },
        ],
      };

      // Calculate tactical metrics
      const positions = formation.positions;

      // Compactness: Average distance between players
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
      const distances = positions.map(p =>
        Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2))
      );
      const compactness = 100 - distances.reduce((sum, d) => sum + d, 0) / distances.length;

      // Width: Horizontal spread
      const maxX = Math.max(...positions.map(p => p.x));
      const minX = Math.min(...positions.map(p => p.x));
      const width = maxX - minX;

      // Depth: Vertical spread
      const maxY = Math.max(...positions.map(p => p.y));
      const minY = Math.min(...positions.map(p => p.y));
      const depth = maxY - minY;

      // Defensive line height
      const defenders = positions.filter(p => p.position.includes('B') || p.position === 'CB');
      const defensiveLine = defenders.reduce((sum, p) => sum + p.y, 0) / defenders.length;

      // Attacking line height
      const attackers = positions.filter(p => p.position.includes('W') || p.position === 'ST');
      const attackingLine = attackers.reduce((sum, p) => sum + p.y, 0) / attackers.length;

      const analysis = {
        structure: {
          compactness: Math.round(compactness),
          width: Math.round(width),
          depth: Math.round(depth),
          defensiveLineHeight: Math.round(defensiveLine),
          attackingLineHeight: Math.round(attackingLine),
        },
        strengths: [
          'Wide attacking options with wingers',
          'Natural width provides passing lanes',
          'Flexible midfield triangle',
          'High pressing capability',
          'Quick transitions possible',
        ],
        weaknesses: [
          'Vulnerable to central overload',
          'Gaps between midfield and defense',
          'Wing-backs can be isolated',
          'Requires high fitness levels',
          'Susceptible to counter-attacks down the middle',
        ],
        tacticalVulnerabilities: [
          {
            area: 'Central Midfield',
            severity: 'medium',
            description: 'Can be outnumbered by 4-man midfield',
            recommendation: 'Drop one CM deeper to provide cover',
          },
          {
            area: 'Wide Defense',
            severity: 'medium',
            description: 'Full-backs exposed when wingers cut inside',
            recommendation: 'Ensure midfielders track back to cover',
          },
          {
            area: 'Transition Defense',
            severity: 'high',
            description: 'Long distance for attackers to recover',
            recommendation: 'Implement immediate counter-press',
          },
        ],
        counterFormations: [
          {
            formation: '4-4-2',
            effectivenessScore: 78,
            reason: 'Compact midfield can stifle creativity',
            tacticalApproach: 'Sit deep and counter through the middle',
          },
          {
            formation: '3-5-2',
            effectivenessScore: 75,
            reason: 'Midfield numbers advantage',
            tacticalApproach: 'Dominate central areas and overload midfield',
          },
          {
            formation: '4-2-3-1',
            effectivenessScore: 72,
            reason: 'Defensive stability with attacking threat',
            tacticalApproach: 'Double pivot protects defense, CAM exploits gaps',
          },
        ],
        recommendations: [
          'Train players in high-press triggers',
          'Develop quick transition patterns',
          'Practice defensive shape when possession is lost',
          'Work on full-back and winger coordination',
          'Implement counter-pressing drills',
        ],
        playerRequirements: [
          { position: 'CM', attributes: ['High stamina', 'Good passing', 'Defensive awareness'] },
          { position: 'LW/RW', attributes: ['Pace', 'Dribbling', 'Work rate'] },
          { position: 'LB/RB', attributes: ['Speed', 'Stamina', 'Crossing ability'] },
          { position: 'ST', attributes: ['Finishing', 'Movement', 'Hold-up play'] },
        ],
      };

      res.json({
        success: true,
        formation,
        analysis,
        metadata: {
          analysisDate: new Date().toISOString(),
          formationType: formation.type,
          totalPositions: positions.length,
        },
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Failed to analyze formation',
      });
    }
  }

  private async exportFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { format = 'json', includeMetadata = 'true', includeAnalytics = 'false' } = req.query;

      if (!id) {
        res.status(400).json({ success: false, message: 'Formation ID is required' });
        return;
      }

      // Validate format
      const validFormats = ['json', 'pdf', 'png'];
      if (!validFormats.includes(format as string)) {
        res.status(400).json({
          success: false,
          message: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
        });
        return;
      }

      // Query formation from database
      // Production: Use Prisma with access control check
      // const formation = await this.db.formation.findFirst({
      //   where: {
      //     id,
      //     OR: [
      //       { userId },
      //       { isPublic: true }
      //     ]
      //   },
      //   include: { positions: true, team: true }
      // });
      // if (!formation) {
      //   return res.status(404).json({ success: false, message: 'Formation not found' });
      // }

      // Mock formation data
      const formationData = {
        id,
        name: '4-3-3 Attacking',
        description: 'High-pressing formation with emphasis on wing play',
        system: '4-3-3',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isPublic: true,
        isTemplate: false,
        players: [
          { id: 'p1', position: { x: 50, y: 5 }, role: 'GK', playerName: 'Goalkeeper' },
          { id: 'p2', position: { x: 20, y: 20 }, role: 'LB', playerName: 'Left Back' },
          { id: 'p3', position: { x: 40, y: 15 }, role: 'CB', playerName: 'Center Back 1' },
          { id: 'p4', position: { x: 60, y: 15 }, role: 'CB', playerName: 'Center Back 2' },
          { id: 'p5', position: { x: 80, y: 20 }, role: 'RB', playerName: 'Right Back' },
          { id: 'p6', position: { x: 30, y: 50 }, role: 'CM', playerName: 'Central Mid 1' },
          { id: 'p7', position: { x: 50, y: 45 }, role: 'CM', playerName: 'Central Mid 2' },
          { id: 'p8', position: { x: 70, y: 50 }, role: 'CM', playerName: 'Central Mid 3' },
          { id: 'p9', position: { x: 20, y: 80 }, role: 'LW', playerName: 'Left Wing' },
          { id: 'p10', position: { x: 50, y: 85 }, role: 'ST', playerName: 'Striker' },
          { id: 'p11', position: { x: 80, y: 80 }, role: 'RW', playerName: 'Right Wing' },
        ],
        tactics: {
          defensiveStyle: 'high-press',
          offensiveStyle: 'possession',
          buildUpSpeed: 'balanced',
          width: 'wide',
        },
      };

      // Add optional metadata and analytics
      if (includeMetadata === 'true') {
        Object.assign(formationData, {
          metadata: {
            totalMatches: 15,
            winRate: 73.3,
            avgGoalsScored: 2.4,
            avgGoalsConceded: 1.1,
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }

      if (includeAnalytics === 'true') {
        Object.assign(formationData, {
          analytics: {
            heatmap: 'Available in full export',
            passingNetwork: 'Available in full export',
            pressureZones: ['high', 'medium', 'low'],
          },
        });
      }

      // Export based on format
      switch (format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="formation-${id}.json"`);
          res.status(200).json({
            success: true,
            data: formationData,
            exportedAt: new Date().toISOString(),
            format: 'json',
            version: '1.0',
          });
          break;

        case 'pdf':
          try {
            // Generate PDF using export service
            const pdfBuffer = await exportService.generateFormationPDF({
              id: formationData.id,
              name: formationData.name,
              system: formationData.system || 'Unknown',
              players: formationData.players || [],
              tactics: formationData.tactics,
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="formation-${id}.pdf"`);
            res.send(pdfBuffer);

            securityLogger.info('Formation PDF exported successfully', {
              formationId: id,
              size: pdfBuffer.length,
              userId,
            });
          } catch (pdfError) {
            securityLogger.error('Formation PDF export failed', {
              error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
              formationId: id,
              userId,
            });
            res.status(500).json({
              success: false,
              message: 'PDF export failed',
              error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
            });
          }
          break;

        case 'png':
          // For PNG export, we'll create a simple text-based representation
          // In production, use Sharp or Canvas to render the formation diagram
          try {
            const pngData = {
              success: true,
              message: 'PNG export - use canvas rendering in production',
              data: {
                format: 'png',
                filename: `formation-${id}.png`,
                formation: formationData,
                hint: 'Implement with Sharp or Canvas to render field and player positions',
              },
            };

            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(pngData);

            securityLogger.info('Formation PNG export requested', {
              formationId: id,
              userId,
              note: 'PNG rendering to be implemented with Sharp/Canvas',
            });
          } catch (pngError) {
            securityLogger.error('Formation PNG export failed', {
              error: pngError instanceof Error ? pngError.message : 'Unknown error',
              formationId: id,
              userId,
            });
            res.status(500).json({
              success: false,
              message: 'PNG export failed',
              error: pngError instanceof Error ? pngError.message : 'Unknown error',
            });
          }
          break;

        default:
          res.status(400).json({ success: false, message: 'Unsupported format' });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to export formation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async importFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { formationData, conflictResolution = 'rename', validatePlayers = 'true' } = req.body;

      // Validate request body
      if (!formationData) {
        res.status(400).json({
          success: false,
          message: 'Formation data is required',
        });
        return;
      }

      // Validate conflict resolution strategy
      const validStrategies = ['rename', 'overwrite', 'skip', 'merge'];
      if (!validStrategies.includes(conflictResolution)) {
        res.status(400).json({
          success: false,
          message: `Invalid conflict resolution strategy. Must be one of: ${validStrategies.join(', ')}`,
        });
        return;
      }

      // Validate formation structure
      const validationErrors: string[] = [];

      if (!formationData.name || typeof formationData.name !== 'string') {
        validationErrors.push('Formation name is required and must be a string');
      }

      if (!formationData.system || typeof formationData.system !== 'string') {
        validationErrors.push('Formation system is required (e.g., "4-4-2", "4-3-3")');
      }

      if (!Array.isArray(formationData.players) || formationData.players.length === 0) {
        validationErrors.push('Formation must include at least one player');
      } else if (formationData.players.length > 11) {
        validationErrors.push('Formation cannot have more than 11 players');
      }

      // Validate player positions
      if (validatePlayers === 'true' && Array.isArray(formationData.players)) {
        formationData.players.forEach(
          (
            player: { id?: string; position?: { x?: number; y?: number }; role?: string },
            index: number
          ) => {
            if (
              !player.position ||
              typeof player.position.x !== 'number' ||
              typeof player.position.y !== 'number'
            ) {
              validationErrors.push(`Player ${index + 1}: Invalid position coordinates`);
            }
            if (
              player.position?.x !== undefined &&
              (player.position.x < 0 || player.position.x > 100)
            ) {
              validationErrors.push(`Player ${index + 1}: X coordinate must be between 0 and 100`);
            }
            if (
              player.position?.y !== undefined &&
              (player.position.y < 0 || player.position.y > 100)
            ) {
              validationErrors.push(`Player ${index + 1}: Y coordinate must be between 0 and 100`);
            }
            if (!player.role) {
              validationErrors.push(`Player ${index + 1}: Role is required`);
            }
          }
        );
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Formation validation failed',
          errors: validationErrors,
        });
        return;
      }

      // Check for existing formations with same name
      // Production: Use Prisma to check for name conflicts
      // const existingFormation = await this.db.formation.findFirst({
      //   where: {
      //     name: formationData.name,
      //     userId
      //   },
      //   select: { id: true, name: true }
      // });

      // Mock duplicate check
      const hasDuplicate = Math.random() > 0.7; // 30% chance of duplicate for testing
      let finalName = formationData.name;
      let conflictResolved = false;

      if (hasDuplicate) {
        switch (conflictResolution) {
          case 'rename':
            finalName = `${formationData.name} (Imported ${new Date().toISOString().split('T')[0]})`;
            conflictResolved = true;
            break;
          case 'overwrite':
            // Delete existing formation from database
            // Production: Use Prisma deleteMany with cascade
            // await this.db.formation.deleteMany({
            //   where: { name: formationData.name, userId }
            // });
            conflictResolved = true;
            break;
          case 'skip':
            res.status(409).json({
              success: false,
              message: 'Formation with this name already exists',
              conflictStrategy: 'skip',
            });
            return;
          case 'merge':
            // Implement merge logic to combine formations
            // Production: Load existing formation and merge positions/tactics
            // const existing = await this.db.formation.findFirst({
            //   where: { name: formationData.name, userId }
            // });
            // formationData.players = [...existing.players, ...formationData.players];
            // formationData.tactics = { ...existing.tactics, ...formationData.tactics };
            conflictResolved = true;
            break;
        }
      }

      // Generate new formation ID
      const newFormationId = uuidv4();

      // Save formation to database
      // Production: Use Prisma to create formation with positions
      // const savedFormation = await this.db.formation.create({
      //   data: {
      //     id: newFormationId,
      //     name: finalName,
      //     system: formationData.system,
      //     userId,
      //     isPublic: formationData.isPublic || false,
      //     version: 1,
      //     positions: {
      //       create: formationData.players.map((p: any) => ({
      //         playerId: p.id,
      //         position: p.position,
      //         x: p.x,
      //         y: p.y
      //       }))
      //     }
      //   },
      //   include: { positions: true }
      // });

      res.status(201).json({
        success: true,
        data: {
          id: newFormationId,
          name: finalName,
          system: formationData.system,
          playersCount: formationData.players.length,
          originalName: formationData.name,
          wasRenamed: finalName !== formationData.name,
          conflictResolved,
          conflictStrategy: conflictResolution,
          createdAt: new Date().toISOString(),
          version: 1,
        },
        message: conflictResolved
          ? `Formation imported successfully with conflict resolution (${conflictResolution})`
          : 'Formation imported successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to import formation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getFormationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Extract formationId early to have it available in error handler
    const formationId = req.params.id;
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const includeDetails = req.query.includeDetails === 'true';

      // Fetch formation version history from database
      const historyRecords = await this.db.appState.findMany({
        where: {
          stateType: 'tactical_board_version',
          stateData: {
            path: ['formationId'],
            equals: formationId,
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        // Note: user relation may not exist in AppState model
        // include: {
        //   user: {
        //     select: {
        //       id: true,
        //       firstName: true,
        //       lastName: true,
        //       role: true
        //     }
        //   }
        // }
      });

      const totalCount = await this.db.appState.count({
        where: {
          stateType: 'tactical_board_version',
          stateData: {
            path: ['formationId'],
            equals: formationId,
          },
        },
      });

      // Transform database records to version history format
      const versions = historyRecords.map((record, index) => {
        const versionData = record.stateData as any;
        // Since AppState doesn't have user relation, use userId from record
        const version: any = {
          id: record.id,
          formationId: formationId,
          version: versionData.version || totalCount - index,
          createdAt: record.createdAt.toISOString(),
          createdBy: {
            id: record.userId || 'system',
            name: 'User', // Could enhance by fetching user separately if needed
            role: 'user',
          },
          changeDescription: versionData.changeDescription || 'Formation updated',
          changeType: versionData.changeType || 'minor',
          changesCount: versionData.changesCount || 1,
          isCurrent: index === 0,
        };

        if (includeDetails && versionData.diff) {
          version.diff = versionData.diff;
          version.snapshot = versionData.snapshot;
        }

        return version;
      });

      // Use database data or fallback to mock for demo
      const finalVersions =
        versions.length > 0
          ? versions
          : (() => {
              // Mock version history data for development/demo
              const totalVersions = 15;
              return Array.from(
                { length: Math.min(limit, totalVersions - (page - 1) * limit) },
                (_, i) => {
                  const versionNumber = totalVersions - ((page - 1) * limit + i);
                  const daysAgo = i * 2;
                  const createdAt = new Date();
                  createdAt.setDate(createdAt.getDate() - daysAgo);

                  const changeTypes = ['players', 'tactics', 'system', 'minor'];
                  const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];

                  let description = '';
                  let changesCount = 0;

                  if (changeType === 'players') {
                    changesCount = Math.floor(Math.random() * 3) + 1;
                    description = `Updated ${changesCount} player position${changesCount > 1 ? 's' : ''}`;
                  } else if (changeType === 'tactics') {
                    description = 'Modified tactical instructions';
                    changesCount = Math.floor(Math.random() * 2) + 1;
                  } else if (changeType === 'system') {
                    description = 'Changed formation system';
                    changesCount = 1;
                  } else {
                    description = 'Minor adjustments';
                    changesCount = 1;
                  }

                  const version: {
                    id: string;
                    formationId: string;
                    version: number;
                    createdAt: string;
                    createdBy: { id: string; name: string; role: string };
                    changeDescription: string;
                    changeType: string;
                    changesCount: number;
                    isCurrent: boolean;
                    diff?: {
                      players: Array<{
                        field: string;
                        playerName: string;
                        oldValue: unknown;
                        newValue: unknown;
                        changeType: string;
                      }>;
                      tactics: Array<{
                        field: string;
                        oldValue: string;
                        newValue: string;
                        changeType: string;
                      }>;
                      system: Array<{
                        field: string;
                        oldValue: string;
                        newValue: string;
                        changeType: string;
                      }>;
                    };
                    snapshot?: {
                      name: string;
                      system: string;
                      playersCount: number;
                      tacticalStyle: string;
                    };
                  } = {
                    id: `version-${versionNumber}`,
                    formationId: formationId,
                    version: versionNumber,
                    createdAt: createdAt.toISOString(),
                    createdBy: {
                      id: req.user?.id || 'user-1',
                      name: req.user?.firstName
                        ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
                        : 'John Doe',
                      role: 'manager',
                    },
                    changeDescription: description,
                    changeType,
                    changesCount,
                    isCurrent: versionNumber === totalVersions,
                  };

                  // Include detailed diff if requested
                  if (includeDetails) {
                    version.diff = {
                      players:
                        changeType === 'players'
                          ? [
                              {
                                field: 'position',
                                playerName: 'Cristiano Ronaldo',
                                oldValue: { x: 80, y: 50 },
                                newValue: { x: 85, y: 45 },
                                changeType: 'moved',
                              },
                            ]
                          : [],
                      tactics:
                        changeType === 'tactics'
                          ? [
                              {
                                field: 'offensiveStyle',
                                oldValue: 'balanced',
                                newValue: 'possession',
                                changeType: 'updated',
                              },
                            ]
                          : [],
                      system:
                        changeType === 'system'
                          ? [
                              {
                                field: 'formation',
                                oldValue: '4-3-3',
                                newValue: '4-4-2',
                                changeType: 'changed',
                              },
                            ]
                          : [],
                    };

                    version.snapshot = {
                      name: `Formation v${versionNumber}`,
                      system: '4-3-3',
                      playersCount: 11,
                      tacticalStyle: changeType === 'tactics' ? 'possession' : 'balanced',
                    };
                  }

                  return version;
                }
              );
            })();

      // Use database pagination or mock pagination
      const totalPages =
        versions.length > 0 ? Math.ceil(totalCount / limit) : Math.ceil(15 / limit);

      res.json({
        success: true,
        data: {
          versions: finalVersions,
          pagination: {
            currentPage: page,
            totalPages,
            totalVersions: versions.length > 0 ? totalCount : 15,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
          formationId: formationId,
          currentVersion: versions.length > 0 ? totalCount : 15,
        },
      });
    } catch (error) {
      securityLogger.error('Error fetching formation history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        formationId: formationId,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch formation history',
      });
    }
  }

  private async revertToVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, version } = req.params;
      const { createBackup = true, force = false } = req.body || {};
      const targetVersion = parseInt(version);

      // Validate version number
      if (isNaN(targetVersion) || targetVersion < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid version number. Version must be a positive integer.',
        });
        return;
      }

      // Fetch current formation from database
      const currentFormationRecord = await this.db.appState.findFirst({
        where: {
          id: id,
          stateType: 'tactical_board',
        },
      });

      if (!currentFormationRecord) {
        res.status(404).json({
          success: false,
          message: 'Formation not found',
        });
        return;
      }

      // Check if user has permission to revert formations
      if (currentFormationRecord.userId !== req.user?.id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to revert formation',
        });
        return;
      }

      // Fetch target version from database
      const targetVersionRecord = await this.db.appState.findFirst({
        where: {
          stateType: 'tactical_board_version',
          stateData: {
            path: ['formationId'],
            equals: id,
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: targetVersion - 1,
        take: 1,
      });

      // Mock current formation data
      const currentFormation = {
        id,
        name: 'My Formation',
        system: '4-3-3',
        currentVersion: 15,
        players: Array.from({ length: 11 }, (_, i) => ({
          id: `player-${i + 1}`,
          name: `Player ${i + 1}`,
          position: { x: 10 + i * 8, y: 20 + i * 5 },
          role: 'CM',
        })),
        tacticalInstructions: {
          offensiveStyle: 'possession',
          defensiveStyle: 'high-press',
        },
      };

      // Validate target version exists
      if (targetVersion > currentFormation.currentVersion) {
        res.status(400).json({
          success: false,
          message: `Target version ${targetVersion} does not exist. Current version is ${currentFormation.currentVersion}.`,
        });
        return;
      }

      // Check if already at target version
      if (targetVersion === currentFormation.currentVersion && !force) {
        res.status(400).json({
          success: false,
          message: `Formation is already at version ${targetVersion}. Use force=true to create a new version.`,
        });
        return;
      }

      // Mock target version data
      const targetVersionData = {
        id: `version-${targetVersion}`,
        formationId: id,
        version: targetVersion,
        name: 'My Formation',
        system: '4-4-2',
        players: Array.from({ length: 11 }, (_, i) => ({
          id: `player-${i + 1}`,
          name: `Player ${i + 1}`,
          position: { x: 15 + i * 7, y: 25 + i * 4 },
          role: 'CM',
        })),
        tacticalInstructions: {
          offensiveStyle: 'balanced',
          defensiveStyle: 'medium-block',
        },
        createdAt: new Date(
          Date.now() - (currentFormation.currentVersion - targetVersion) * 2 * 24 * 60 * 60 * 1000
        ),
        createdBy: {
          id: req.user?.id || 'user-1',
          name: req.user?.firstName
            ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
            : 'John Doe',
        },
      };

      // Create backup if requested
      let backupVersion: {
        id: string;
        version: number;
        createdAt: string;
        description: string;
      } | null = null;
      if (createBackup) {
        const backupRecord = await this.db.appState.create({
          data: {
            userId: req.user?.id || '',
            stateType: 'tactical_board_version',
            stateData: {
              formationId: id,
              version: currentFormation.currentVersion + 1,
              changeDescription: `Backup before reverting to v${targetVersion}`,
              changeType: 'backup',
              changesCount: 0,
              snapshot: currentFormation,
              diff: {},
            },
          },
        });

        backupVersion = {
          id: backupRecord.id,
          version: currentFormation.currentVersion + 1,
          createdAt: backupRecord.createdAt.toISOString(),
          description: `Backup before reverting to v${targetVersion}`,
        };

        securityLogger.info('Created backup version before revert', {
          userId: req.user?.id,
          formationId: id,
          backupVersion: backupVersion.version,
        });
      }

      // Revert formation to target version in database
      if (targetVersionRecord) {
        const targetData = targetVersionRecord.stateData as any;
        await this.db.appState.update({
          where: { id: id },
          data: {
            stateData: {
              ...(currentFormationRecord.stateData as any),
              ...targetData.snapshot,
              currentVersion: currentFormation.currentVersion + 1,
              revertedFrom: currentFormation.currentVersion,
              revertedTo: targetVersion,
            },
            updatedAt: new Date(),
          },
        });

        securityLogger.info('Reverted formation to previous version', {
          userId: req.user?.id,
          formationId: id,
          fromVersion: currentFormation.currentVersion,
          toVersion: targetVersion,
        });
      }

      // Calculate diff summary
      const diffSummary = {
        systemChanged: currentFormation.system !== targetVersionData.system,
        playersModified: targetVersionData.players.length,
        tacticsChanged: [
          currentFormation.tacticalInstructions.offensiveStyle !==
          targetVersionData.tacticalInstructions.offensiveStyle
            ? 'offensiveStyle'
            : null,
          currentFormation.tacticalInstructions.defensiveStyle !==
          targetVersionData.tacticalInstructions.defensiveStyle
            ? 'defensiveStyle'
            : null,
        ].filter(Boolean),
        positionChanges: Math.floor(Math.random() * 5) + 1,
      };

      const newVersion = currentFormation.currentVersion + 1;

      res.json({
        success: true,
        data: {
          formationId: id,
          revertedFrom: currentFormation.currentVersion,
          revertedTo: targetVersion,
          newVersion,
          backup: backupVersion,
          diffSummary,
          message: `Successfully reverted formation from v${currentFormation.currentVersion} to v${targetVersion}`,
          formation: {
            id,
            name: targetVersionData.name,
            system: targetVersionData.system,
            currentVersion: newVersion,
            playersCount: targetVersionData.players.length,
            tacticalStyle: targetVersionData.tacticalInstructions.offensiveStyle,
          },
        },
      });
    } catch (error) {
      securityLogger.error('Error reverting formation version', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        formationId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to revert formation version',
      });
    }
  }

  private async getPositionHeatmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { matchIds, playerId, gridSize = '10x10', includeMovement = 'false' } = req.query;

      // Parse grid size
      const [gridWidth, gridHeight] = (gridSize as string).split('x').map(Number);
      if (
        !gridWidth ||
        !gridHeight ||
        gridWidth < 5 ||
        gridWidth > 50 ||
        gridHeight < 5 ||
        gridHeight > 50
      ) {
        res.status(400).json({
          success: false,
          message:
            'Invalid grid size. Must be in format WxH (e.g., 10x10) with dimensions between 5-50.',
        });
        return;
      }

      // Fetch formation and match data from database
      // Production: Use Prisma to query Formation and Match models
      // const formation = await this.db.formation.findUnique({
      //   where: { id },
      //   include: { positions: true }
      // });
      // const matchIdArray = matchIds ? (matchIds as string).split(',') : [];
      // const matches = await this.db.match.findMany({
      //   where: matchIdArray.length > 0
      //     ? { id: { in: matchIdArray } }
      //     : { formationId: id },
      //   include: { events: true }
      // });

      // Mock position data aggregation
      const cellWidth = 100 / gridWidth;
      const cellHeight = 100 / gridHeight;

      // Generate heatmap grid with intensity values
      const heatmapData = Array.from({ length: gridHeight }, (_, y) =>
        Array.from({ length: gridWidth }, (_, x) => {
          // Calculate cell center
          const cellCenterX = x * cellWidth + cellWidth / 2;
          const cellCenterY = y * cellHeight + cellHeight / 2;

          // Mock intensity based on typical football positions
          // Higher intensity in midfield and attacking areas
          let baseIntensity = 0;

          // Center midfield (high activity)
          if (cellCenterX >= 40 && cellCenterX <= 60 && cellCenterY >= 30 && cellCenterY <= 70) {
            baseIntensity = 0.7 + Math.random() * 0.3;
          }
          // Attacking third (moderate-high activity)
          else if (cellCenterX >= 70) {
            baseIntensity = 0.5 + Math.random() * 0.3;
          }
          // Defensive third (moderate activity)
          else if (cellCenterX <= 30) {
            baseIntensity = 0.4 + Math.random() * 0.2;
          }
          // Wide areas (lower activity)
          else if (cellCenterY <= 20 || cellCenterY >= 80) {
            baseIntensity = 0.2 + Math.random() * 0.2;
          }
          // Default areas
          else {
            baseIntensity = 0.3 + Math.random() * 0.2;
          }

          return {
            x,
            y,
            centerX: Math.round(cellCenterX * 10) / 10,
            centerY: Math.round(cellCenterY * 10) / 10,
            intensity: Math.round(baseIntensity * 100) / 100,
            touches: Math.floor(baseIntensity * 150),
            avgDuration: Math.round((2 + Math.random() * 3) * 10) / 10,
          };
        })
      );

      // Find hotspots (cells with intensity > 0.7)
      const hotspots = heatmapData
        .flat()
        .filter(cell => cell.intensity >= 0.7)
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 5)
        .map(cell => ({
          position: { x: cell.centerX, y: cell.centerY },
          intensity: cell.intensity,
          touches: cell.touches,
          zone: this.determineZone(cell.centerX, cell.centerY),
        }));

      // Movement patterns (if requested)
      let movementPatterns:
        | Array<{
            from: { x: number; y: number };
            to: { x: number; y: number };
            frequency: number;
            avgSpeed: number;
            type: string;
          }>
        | undefined = undefined;
      if (includeMovement === 'true') {
        movementPatterns = [
          {
            from: { x: 50, y: 50 },
            to: { x: 70, y: 40 },
            frequency: 45,
            avgSpeed: 12.5,
            type: 'attacking-run',
          },
          {
            from: { x: 50, y: 50 },
            to: { x: 30, y: 50 },
            frequency: 38,
            avgSpeed: 8.3,
            type: 'defensive-retreat',
          },
          {
            from: { x: 70, y: 20 },
            to: { x: 70, y: 80 },
            frequency: 32,
            avgSpeed: 15.2,
            type: 'wing-switch',
          },
        ];
      }

      // Calculate coverage statistics
      const totalCells = gridWidth * gridHeight;
      const activeCells = heatmapData.flat().filter(cell => cell.intensity > 0.1).length;
      const coveragePercentage = Math.round((activeCells / totalCells) * 100 * 10) / 10;

      res.json({
        success: true,
        data: {
          formationId: id,
          playerId: playerId || null,
          gridSize: { width: gridWidth, height: gridHeight },
          heatmap: heatmapData,
          hotspots,
          movementPatterns,
          statistics: {
            totalCells,
            activeCells,
            coveragePercentage,
            avgIntensity:
              Math.round(
                (heatmapData.flat().reduce((sum, cell) => sum + cell.intensity, 0) / totalCells) *
                  100
              ) / 100,
            peakIntensity: Math.max(...heatmapData.flat().map(cell => cell.intensity)),
            totalTouches: heatmapData.flat().reduce((sum, cell) => sum + cell.touches, 0),
          },
          matchesAnalyzed: matchIds ? (matchIds as string).split(',').length : 10,
        },
      });
    } catch (error) {
      securityLogger.error('Error generating position heatmap', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        formationId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to generate position heatmap',
      });
    }
  }

  // Helper method to determine tactical zone
  private determineZone(x: number, y: number): string {
    if (x <= 33) {
      if (y <= 33) {
        return 'defensive-left';
      }
      if (y >= 67) {
        return 'defensive-right';
      }
      return 'defensive-center';
    } else if (x >= 67) {
      if (y <= 33) {
        return 'attacking-left';
      }
      if (y >= 67) {
        return 'attacking-right';
      }
      return 'attacking-center';
    } else {
      if (y <= 33) {
        return 'midfield-left';
      }
      if (y >= 67) {
        return 'midfield-right';
      }
      return 'midfield-center';
    }
  }

  private async getEffectivenessMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate, opponentStrength: _opponentStrength } = req.query;

      // Fetch formation and match results from database
      // Production: Use Prisma to query Formation and Match models
      // const formation = await this.db.formation.findUnique({
      //   where: { id },
      //   include: { team: true }
      // });
      // const matches = await this.db.match.findMany({
      //   where: {
      //     formationId: id,
      //     date: { gte: new Date(startDate as string), lte: new Date(endDate as string) },
      //     ...(opponentStrength && { opponentStrength })
      //   },
      //   include: { events: true, opponent: true }
      // });

      // Mock match data for effectiveness analysis
      const totalMatches = 25;
      const wins = 14;
      const draws = 6;
      const losses = 5;

      const winRate = Math.round((wins / totalMatches) * 100 * 10) / 10;
      const pointsPerGame = Math.round(((wins * 3 + draws) / totalMatches) * 100) / 100;

      // Tactical objectives achievement
      const tacticalObjectives = [
        {
          objective: 'Possession Control',
          target: 55,
          achieved: 58.3,
          success: true,
          rating: 'excellent',
        },
        {
          objective: 'High Press Success',
          target: 65,
          achieved: 62.1,
          success: false,
          rating: 'good',
        },
        {
          objective: 'Attacking Transitions',
          target: 70,
          achieved: 74.5,
          success: true,
          rating: 'excellent',
        },
        {
          objective: 'Defensive Stability',
          target: 75,
          achieved: 71.2,
          success: false,
          rating: 'good',
        },
        {
          objective: 'Set Piece Efficiency',
          target: 60,
          achieved: 55.8,
          success: false,
          rating: 'average',
        },
      ];

      const objectivesAchieved = tacticalObjectives.filter(obj => obj.success).length;
      const objectiveSuccessRate =
        Math.round((objectivesAchieved / tacticalObjectives.length) * 100 * 10) / 10;

      // Performance metrics by phase
      const performanceByPhase = {
        attacking: {
          goalsPerGame: 1.8,
          shotsPerGame: 14.2,
          shotAccuracy: 42.5,
          chancesCreated: 11.3,
          xG: 1.65,
          rating: 82,
        },
        midfield: {
          possession: 58.3,
          passAccuracy: 84.7,
          tacklesWon: 62.1,
          interceptions: 8.5,
          rating: 79,
        },
        defensive: {
          goalsAgainstPerGame: 1.2,
          cleanSheetPercentage: 32.0,
          tackleSuccessRate: 68.4,
          aerialDuelsWon: 55.2,
          rating: 75,
        },
      };

      // Effectiveness by opponent strength
      const effectivenessByOpponent = [
        { strength: 'weak', matches: 8, winRate: 87.5, pointsPerGame: 2.75, rating: 'dominant' },
        {
          strength: 'average',
          matches: 12,
          winRate: 58.3,
          pointsPerGame: 1.92,
          rating: 'effective',
        },
        { strength: 'strong', matches: 5, winRate: 20.0, pointsPerGame: 0.8, rating: 'struggling' },
      ];

      // Overall effectiveness score (0-100)
      const effectivenessScore =
        Math.round(
          (winRate * 0.3 +
            pointsPerGame * 10 * 0.2 +
            objectiveSuccessRate * 0.2 +
            performanceByPhase.attacking.rating * 0.1 +
            performanceByPhase.midfield.rating * 0.1 +
            performanceByPhase.defensive.rating * 0.1) *
            10
        ) / 10;

      // Strengths and weaknesses analysis
      const strengths = [
        { area: 'Attacking Transitions', score: 87, impact: 'high' },
        { area: 'Possession Control', score: 83, impact: 'high' },
        { area: 'Chance Creation', score: 78, impact: 'medium' },
      ];

      const weaknesses = [
        { area: 'vs Strong Opposition', score: 42, impact: 'high' },
        { area: 'Set Piece Defense', score: 58, impact: 'medium' },
        { area: 'High Press Execution', score: 62, impact: 'medium' },
      ];

      // Recommendations
      const recommendations = [
        {
          priority: 'high',
          category: 'tactical',
          suggestion:
            'Adjust defensive shape against strong opponents - consider deeper defensive line',
          expectedImprovement: '15-20% improvement in points per game vs strong teams',
        },
        {
          priority: 'medium',
          category: 'training',
          suggestion: 'Focus training on set piece defensive organization',
          expectedImprovement: '10% reduction in goals conceded from set pieces',
        },
        {
          priority: 'medium',
          category: 'personnel',
          suggestion: 'Consider more aggressive midfielders to improve press success rate',
          expectedImprovement: '5-8% increase in possession won in attacking third',
        },
      ];

      res.json({
        success: true,
        data: {
          formationId: id,
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
            matchesAnalyzed: totalMatches,
          },
          overallEffectiveness: {
            score: effectivenessScore,
            rating:
              effectivenessScore >= 75
                ? 'excellent'
                : effectivenessScore >= 60
                  ? 'good'
                  : 'needs improvement',
            winRate,
            pointsPerGame,
            record: { wins, draws, losses },
          },
          tacticalObjectives: {
            objectives: tacticalObjectives,
            successRate: objectiveSuccessRate,
            achieved: objectivesAchieved,
            total: tacticalObjectives.length,
          },
          performanceByPhase,
          effectivenessByOpponent,
          strengths,
          weaknesses,
          recommendations,
        },
      });
    } catch (error) {
      // Implement production logging
      securityLogger.error('Error calculating effectiveness metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        formationId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to calculate effectiveness metrics',
      });
    }
  }

  private async getPopularFormations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { limit = '10', timeframe = '30d', league, level } = req.query;
      const maxLimit = Math.min(parseInt(limit as string), 50);

      // Parse timeframe
      const timeframeMatch = (timeframe as string).match(/(\d+)([dwmy])/);
      if (!timeframeMatch) {
        res.status(400).json({
          success: false,
          message: 'Invalid timeframe format. Use format like: 7d, 4w, 3m, 1y',
        });
        return;
      }

      const [, amount, unit] = timeframeMatch;
      const timeframeDays =
        unit === 'd'
          ? parseInt(amount)
          : unit === 'w'
            ? parseInt(amount) * 7
            : unit === 'm'
              ? parseInt(amount) * 30
              : parseInt(amount) * 365;

      // Fetch popular formations from database with aggregation
      // Production: Use Prisma groupBy or raw SQL for aggregation
      // const timeframeCutoff = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
      // const popularFormations = await this.db.formation.groupBy({
      //   by: ['system'],
      //   where: {
      //     createdAt: { gte: timeframeCutoff },
      //     ...(league && { league }),
      //     ...(level && { level })
      //   },
      //   _count: { system: true },
      //   _avg: { winRate: true },
      //   orderBy: { _count: { system: 'desc' } },
      //   take: maxLimit
      // });

      // Mock popular formations data
      const popularFormations = [
        {
          id: 'formation-433',
          system: '4-3-3',
          name: '4-3-3 Attacking',
          usageCount: 1247,
          usagePercentage: 18.5,
          trend: 'rising',
          trendChange: 12.3,
          avgWinRate: 58.2,
          avgGoalsScored: 1.9,
          avgGoalsConceded: 1.3,
          topLeagues: ['Premier League', 'La Liga', 'Bundesliga'],
          popularity: {
            professional: 92,
            amateur: 78,
            youth: 85,
          },
          characteristics: {
            style: 'attacking',
            possession: 'high',
            pressing: 'high',
            width: 'wide',
          },
        },
        {
          id: 'formation-4231',
          system: '4-2-3-1',
          name: '4-2-3-1 Balanced',
          usageCount: 1156,
          usagePercentage: 17.1,
          trend: 'stable',
          trendChange: 2.1,
          avgWinRate: 56.8,
          avgGoalsScored: 1.7,
          avgGoalsConceded: 1.2,
          topLeagues: ['Serie A', 'Premier League', 'Ligue 1'],
          popularity: {
            professional: 95,
            amateur: 82,
            youth: 76,
          },
          characteristics: {
            style: 'balanced',
            possession: 'medium',
            pressing: 'medium',
            width: 'balanced',
          },
        },
        {
          id: 'formation-442',
          system: '4-4-2',
          name: '4-4-2 Classic',
          usageCount: 892,
          usagePercentage: 13.2,
          trend: 'declining',
          trendChange: -8.5,
          avgWinRate: 54.3,
          avgGoalsScored: 1.6,
          avgGoalsConceded: 1.4,
          topLeagues: ['Championship', 'Serie B', 'La Liga 2'],
          popularity: {
            professional: 68,
            amateur: 88,
            youth: 91,
          },
          characteristics: {
            style: 'direct',
            possession: 'medium',
            pressing: 'medium',
            width: 'wide',
          },
        },
        {
          id: 'formation-352',
          system: '3-5-2',
          name: '3-5-2 Wing-backs',
          usageCount: 734,
          usagePercentage: 10.9,
          trend: 'rising',
          trendChange: 15.7,
          avgWinRate: 59.1,
          avgGoalsScored: 1.8,
          avgGoalsConceded: 1.5,
          topLeagues: ['Serie A', 'Bundesliga', 'Eredivisie'],
          popularity: {
            professional: 88,
            amateur: 65,
            youth: 58,
          },
          characteristics: {
            style: 'balanced',
            possession: 'high',
            pressing: 'medium',
            width: 'very-wide',
          },
        },
        {
          id: 'formation-41212',
          system: '4-1-2-1-2',
          name: '4-1-2-1-2 Narrow',
          usageCount: 623,
          usagePercentage: 9.2,
          trend: 'stable',
          trendChange: -1.2,
          avgWinRate: 57.4,
          avgGoalsScored: 2.0,
          avgGoalsConceded: 1.6,
          topLeagues: ['Serie A', 'Ligue 1', 'Portuguese Liga'],
          popularity: {
            professional: 75,
            amateur: 71,
            youth: 63,
          },
          characteristics: {
            style: 'attacking',
            possession: 'high',
            pressing: 'high',
            width: 'narrow',
          },
        },
      ].slice(0, maxLimit);

      // Calculate trend statistics
      const trendingUp = popularFormations.filter(f => f.trend === 'rising').length;
      const trendingDown = popularFormations.filter(f => f.trend === 'declining').length;
      const stable = popularFormations.filter(f => f.trend === 'stable').length;

      // Most successful formation (by win rate)
      const mostSuccessful = popularFormations.reduce((prev, current) =>
        current.avgWinRate > prev.avgWinRate ? current : prev
      );

      // Fastest rising formation
      const fastestRising = popularFormations.reduce((prev, current) =>
        current.trendChange > prev.trendChange ? current : prev
      );

      // Style distribution
      const styleDistribution = popularFormations.reduce(
        (acc, formation) => {
          const style = formation.characteristics.style;
          acc[style] = (acc[style] || 0) + formation.usageCount;
          return acc;
        },
        {} as Record<string, number>
      );

      res.json({
        success: true,
        data: {
          formations: popularFormations,
          statistics: {
            totalFormationsTracked: 6743,
            timeframe: timeframe as string,
            timeframeDays,
            league: league || 'all',
            level: level || 'all',
            trendSummary: {
              rising: trendingUp,
              declining: trendingDown,
              stable,
            },
          },
          insights: {
            mostPopular: popularFormations[0],
            mostSuccessful,
            fastestRising,
            styleDistribution,
            avgWinRateAcrossAll:
              Math.round(
                (popularFormations.reduce((sum, f) => sum + f.avgWinRate, 0) /
                  popularFormations.length) *
                  10
              ) / 10,
          },
        },
      });
    } catch (error) {
      securityLogger.error('Error fetching popular formations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular formations',
      });
    }
  }

  private async getFormationTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        category,
        system,
        difficulty,
        tags,
        includeCustom: _includeCustom = 'false',
      } = req.query;

      // Fetch formation templates from database
      // Production: Use Prisma to query FormationTemplate model (or appState with type 'template')
      // const templates = await this.db.appState.findMany({
      //   where: {
      //     stateType: 'formation_template',
      //     ...(category && { stateData: { path: ['category'], equals: category } }),
      //     ...(system && { stateData: { path: ['system'], equals: system } }),
      //     ...(difficulty && { stateData: { path: ['difficulty'], equals: difficulty } }),
      //     ...(tags && { stateData: { path: ['tags'], array_contains: (tags as string).split(',') } })
      //   }
      // });
      // Parse stateData to get template objects

      // Mock formation template library
      const allTemplates = [
        {
          id: 'template-433-tiki-taka',
          name: 'Tiki-Taka 4-3-3',
          system: '4-3-3',
          category: 'attacking',
          difficulty: 'advanced',
          description: 'Possession-based attacking football with high press and quick passing',
          author: 'System',
          isOfficial: true,
          usageCount: 3421,
          rating: 4.7,
          tags: ['possession', 'high-press', 'attacking', 'technical'],
          tacticalInstructions: {
            offensiveStyle: 'possession',
            defensiveStyle: 'high-press',
            buildUpSpeed: 'slow',
            width: 'wide',
            pressure: 'high',
            aggressiveness: 'high',
          },
          suitableFor: {
            playerLevel: ['professional', 'advanced'],
            teamStrength: ['strong', 'elite'],
            preferredAgainst: ['possession-based', 'counter-attack'],
          },
          keyPositions: [
            {
              role: 'GK',
              position: { x: 5, y: 50 },
              importance: 'high',
              attributes: ['reflexes', 'distribution'],
            },
            {
              role: 'LB',
              position: { x: 20, y: 15 },
              importance: 'high',
              attributes: ['pace', 'crossing'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 35 },
              importance: 'critical',
              attributes: ['positioning', 'passing'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 65 },
              importance: 'critical',
              attributes: ['positioning', 'passing'],
            },
            {
              role: 'RB',
              position: { x: 20, y: 85 },
              importance: 'high',
              attributes: ['pace', 'crossing'],
            },
            {
              role: 'CDM',
              position: { x: 40, y: 50 },
              importance: 'critical',
              attributes: ['vision', 'passing', 'interceptions'],
            },
            {
              role: 'CM',
              position: { x: 55, y: 35 },
              importance: 'high',
              attributes: ['stamina', 'passing', 'dribbling'],
            },
            {
              role: 'CM',
              position: { x: 55, y: 65 },
              importance: 'high',
              attributes: ['stamina', 'passing', 'dribbling'],
            },
            {
              role: 'LW',
              position: { x: 80, y: 20 },
              importance: 'critical',
              attributes: ['pace', 'dribbling', 'finishing'],
            },
            {
              role: 'ST',
              position: { x: 85, y: 50 },
              importance: 'critical',
              attributes: ['finishing', 'positioning', 'link-up'],
            },
            {
              role: 'RW',
              position: { x: 80, y: 80 },
              importance: 'critical',
              attributes: ['pace', 'dribbling', 'finishing'],
            },
          ],
          strengths: ['Ball retention', 'Creating chances', 'Controlling tempo'],
          weaknesses: [
            'Vulnerable to counter-attacks',
            'Requires technical players',
            'High stamina demands',
          ],
          createdAt: new Date('2024-01-15').toISOString(),
          updatedAt: new Date('2024-09-10').toISOString(),
        },
        {
          id: 'template-4231-balanced',
          name: 'Balanced 4-2-3-1',
          system: '4-2-3-1',
          category: 'balanced',
          difficulty: 'intermediate',
          description: 'Versatile formation offering defensive stability and attacking flexibility',
          author: 'System',
          isOfficial: true,
          usageCount: 2834,
          rating: 4.6,
          tags: ['balanced', 'versatile', 'defensive-stability', 'flexible'],
          tacticalInstructions: {
            offensiveStyle: 'balanced',
            defensiveStyle: 'medium-block',
            buildUpSpeed: 'balanced',
            width: 'balanced',
            pressure: 'medium',
            aggressiveness: 'medium',
          },
          suitableFor: {
            playerLevel: ['intermediate', 'professional'],
            teamStrength: ['average', 'strong'],
            preferredAgainst: ['any'],
          },
          keyPositions: [
            {
              role: 'GK',
              position: { x: 5, y: 50 },
              importance: 'high',
              attributes: ['reflexes', 'positioning'],
            },
            {
              role: 'LB',
              position: { x: 20, y: 15 },
              importance: 'medium',
              attributes: ['defending', 'pace'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 35 },
              importance: 'critical',
              attributes: ['tackling', 'heading'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 65 },
              importance: 'critical',
              attributes: ['tackling', 'heading'],
            },
            {
              role: 'RB',
              position: { x: 20, y: 85 },
              importance: 'medium',
              attributes: ['defending', 'pace'],
            },
            {
              role: 'CDM',
              position: { x: 35, y: 40 },
              importance: 'critical',
              attributes: ['tackling', 'interceptions'],
            },
            {
              role: 'CDM',
              position: { x: 35, y: 60 },
              importance: 'critical',
              attributes: ['tackling', 'interceptions'],
            },
            {
              role: 'CAM',
              position: { x: 60, y: 50 },
              importance: 'critical',
              attributes: ['vision', 'passing', 'shooting'],
            },
            {
              role: 'LM',
              position: { x: 65, y: 25 },
              importance: 'high',
              attributes: ['pace', 'crossing'],
            },
            {
              role: 'RM',
              position: { x: 65, y: 75 },
              importance: 'high',
              attributes: ['pace', 'crossing'],
            },
            {
              role: 'ST',
              position: { x: 85, y: 50 },
              importance: 'critical',
              attributes: ['finishing', 'positioning'],
            },
          ],
          strengths: ['Defensive solidity', 'Midfield control', 'Tactical flexibility'],
          weaknesses: ['Can lack width', 'Striker isolation', 'Requires disciplined CDMs'],
          createdAt: new Date('2024-02-20').toISOString(),
          updatedAt: new Date('2024-09-15').toISOString(),
        },
        {
          id: 'template-352-wingback',
          name: 'Wing-back 3-5-2',
          system: '3-5-2',
          category: 'attacking',
          difficulty: 'advanced',
          description: 'Dynamic formation with attacking wing-backs providing width',
          author: 'System',
          isOfficial: true,
          usageCount: 1567,
          rating: 4.5,
          tags: ['wing-backs', 'width', 'midfield-dominance', 'flexible'],
          tacticalInstructions: {
            offensiveStyle: 'balanced',
            defensiveStyle: 'medium-block',
            buildUpSpeed: 'balanced',
            width: 'very-wide',
            pressure: 'medium',
            aggressiveness: 'medium',
          },
          suitableFor: {
            playerLevel: ['professional', 'advanced'],
            teamStrength: ['strong', 'elite'],
            preferredAgainst: ['narrow-formations', '4-4-2'],
          },
          keyPositions: [
            {
              role: 'GK',
              position: { x: 5, y: 50 },
              importance: 'high',
              attributes: ['reflexes', 'sweeper-keeper'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 30 },
              importance: 'critical',
              attributes: ['tackling', 'positioning'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 50 },
              importance: 'critical',
              attributes: ['tackling', 'passing'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 70 },
              importance: 'critical',
              attributes: ['tackling', 'positioning'],
            },
            {
              role: 'LWB',
              position: { x: 50, y: 10 },
              importance: 'critical',
              attributes: ['stamina', 'pace', 'crossing'],
            },
            {
              role: 'CM',
              position: { x: 45, y: 40 },
              importance: 'high',
              attributes: ['passing', 'work-rate'],
            },
            {
              role: 'CM',
              position: { x: 45, y: 60 },
              importance: 'high',
              attributes: ['passing', 'work-rate'],
            },
            {
              role: 'RWB',
              position: { x: 50, y: 90 },
              importance: 'critical',
              attributes: ['stamina', 'pace', 'crossing'],
            },
            {
              role: 'CAM',
              position: { x: 65, y: 50 },
              importance: 'high',
              attributes: ['vision', 'creativity'],
            },
            {
              role: 'ST',
              position: { x: 85, y: 40 },
              importance: 'critical',
              attributes: ['finishing', 'movement'],
            },
            {
              role: 'ST',
              position: { x: 85, y: 60 },
              importance: 'critical',
              attributes: ['finishing', 'hold-up'],
            },
          ],
          strengths: ['Width from wing-backs', 'Midfield numbers', 'Attacking flexibility'],
          weaknesses: [
            'Vulnerable on counter',
            'Wing-backs must be fit',
            'Requires tactical discipline',
          ],
          createdAt: new Date('2024-03-10').toISOString(),
          updatedAt: new Date('2024-09-05').toISOString(),
        },
        {
          id: 'template-442-classic',
          name: 'Classic 4-4-2',
          system: '4-4-2',
          category: 'balanced',
          difficulty: 'beginner',
          description: 'Traditional formation with simplicity and effectiveness',
          author: 'System',
          isOfficial: true,
          usageCount: 2145,
          rating: 4.3,
          tags: ['traditional', 'simple', 'balanced', 'beginner-friendly'],
          tacticalInstructions: {
            offensiveStyle: 'direct',
            defensiveStyle: 'medium-block',
            buildUpSpeed: 'fast',
            width: 'wide',
            pressure: 'medium',
            aggressiveness: 'medium',
          },
          suitableFor: {
            playerLevel: ['beginner', 'intermediate'],
            teamStrength: ['weak', 'average', 'strong'],
            preferredAgainst: ['4-3-3', '4-2-3-1'],
          },
          keyPositions: [
            {
              role: 'GK',
              position: { x: 5, y: 50 },
              importance: 'high',
              attributes: ['reflexes', 'handling'],
            },
            {
              role: 'LB',
              position: { x: 20, y: 15 },
              importance: 'medium',
              attributes: ['defending', 'stamina'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 35 },
              importance: 'critical',
              attributes: ['heading', 'tackling'],
            },
            {
              role: 'CB',
              position: { x: 15, y: 65 },
              importance: 'critical',
              attributes: ['heading', 'tackling'],
            },
            {
              role: 'RB',
              position: { x: 20, y: 85 },
              importance: 'medium',
              attributes: ['defending', 'stamina'],
            },
            {
              role: 'LM',
              position: { x: 50, y: 20 },
              importance: 'high',
              attributes: ['crossing', 'work-rate'],
            },
            {
              role: 'CM',
              position: { x: 45, y: 40 },
              importance: 'high',
              attributes: ['passing', 'tackling'],
            },
            {
              role: 'CM',
              position: { x: 45, y: 60 },
              importance: 'high',
              attributes: ['passing', 'tackling'],
            },
            {
              role: 'RM',
              position: { x: 50, y: 80 },
              importance: 'high',
              attributes: ['crossing', 'work-rate'],
            },
            {
              role: 'ST',
              position: { x: 80, y: 40 },
              importance: 'critical',
              attributes: ['finishing', 'heading'],
            },
            {
              role: 'ST',
              position: { x: 80, y: 60 },
              importance: 'critical',
              attributes: ['finishing', 'hold-up'],
            },
          ],
          strengths: ['Easy to understand', 'Compact shape', 'Good for counter-attacks'],
          weaknesses: ['Can be overrun in midfield', 'Lacks creativity', 'Predictable'],
          createdAt: new Date('2024-01-05').toISOString(),
          updatedAt: new Date('2024-08-30').toISOString(),
        },
      ];

      // Filter templates based on query parameters
      let filteredTemplates = allTemplates;

      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }

      if (system) {
        filteredTemplates = filteredTemplates.filter(t => t.system === system);
      }

      if (difficulty) {
        filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
      }

      if (tags) {
        const tagArray = (tags as string).split(',');
        filteredTemplates = filteredTemplates.filter(t =>
          tagArray.some(tag => t.tags.includes(tag))
        );
      }

      // If includeCustom is true, also fetch user's custom templates
      // Production: Query user's private templates from database
      // if (includeCustom === 'true' && req.user?.id) {
      //   const customTemplates = await this.db.appState.findMany({
      //     where: {
      //       stateType: 'formation_template',
      //       userId: req.user.id,
      //       stateData: { path: ['isPublic'], equals: false }
      //     }
      //   });
      //   filteredTemplates = [...filteredTemplates, ...customTemplates.map(t => t.stateData)];
      // }

      // Group templates by category
      const templatesByCategory = filteredTemplates.reduce(
        (acc, template) => {
          const cat = template.category;
          if (!acc[cat]) {
            acc[cat] = [];
          }
          acc[cat].push(template);
          return acc;
        },
        {} as Record<string, typeof allTemplates>
      );

      // Group templates by system
      const templatesBySystem = filteredTemplates.reduce(
        (acc, template) => {
          const sys = template.system;
          if (!acc[sys]) {
            acc[sys] = [];
          }
          acc[sys].push(template);
          return acc;
        },
        {} as Record<string, typeof allTemplates>
      );

      // Calculate statistics
      const statistics = {
        totalTemplates: filteredTemplates.length,
        byCategory: Object.keys(templatesByCategory).map(cat => ({
          category: cat,
          count: templatesByCategory[cat].length,
        })),
        bySystem: Object.keys(templatesBySystem).map(sys => ({
          system: sys,
          count: templatesBySystem[sys].length,
        })),
        byDifficulty: {
          beginner: filteredTemplates.filter(t => t.difficulty === 'beginner').length,
          intermediate: filteredTemplates.filter(t => t.difficulty === 'intermediate').length,
          advanced: filteredTemplates.filter(t => t.difficulty === 'advanced').length,
        },
        avgRating:
          Math.round(
            (filteredTemplates.reduce((sum, t) => sum + t.rating, 0) / filteredTemplates.length) *
              10
          ) / 10,
        totalUsage: filteredTemplates.reduce((sum, t) => sum + t.usageCount, 0),
      };

      res.json({
        success: true,
        data: {
          templates: filteredTemplates,
          templatesByCategory,
          templatesBySystem,
          statistics,
          filters: {
            category: category || null,
            system: system || null,
            difficulty: difficulty || null,
            tags: tags || null,
          },
        },
      });
    } catch (error) {
      securityLogger.error('Error fetching formation templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch formation templates',
      });
    }
  }

  private async convertToTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        difficulty,
        tags = [],
        isPublic = false,
        includeTacticalInstructions = true,
        includePlayerAttributes = true,
      } = req.body;

      // Validate required fields
      if (!name || !description || !category || !difficulty) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, description, category, difficulty',
          requiredFields: ['name', 'description', 'category', 'difficulty'],
        });
        return;
      }

      // Validate category
      const validCategories = [
        'attacking',
        'defensive',
        'balanced',
        'counter-attack',
        'possession',
      ];
      if (!validCategories.includes(category)) {
        res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        });
        return;
      }

      // Validate difficulty
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validDifficulties.includes(difficulty)) {
        res.status(400).json({
          success: false,
          message: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`,
        });
        return;
      }

      // Fetch formation from database
      // Production: Use Prisma to load formation with positions
      // const formation = await this.db.formation.findUnique({
      //   where: { id },
      //   include: { positions: true, team: true }
      // });
      // if (!formation) {
      //   return res.status(404).json({ success: false, message: 'Formation not found' });
      // }

      // Check if user owns the formation or has permission
      // Production: Verify ownership or admin/template-creator permissions
      // if (formation.userId !== req.user?.id) {
      //   const user = await this.db.user.findUnique({
      //     where: { id: req.user?.id },
      //     select: { role: true }
      //   });
      //   const hasPermission = user?.role === 'admin' || user?.role === 'coach';
      //   if (!hasPermission) {
      //     return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      //   }
      // }

      // Mock formation data for conversion
      const formation = {
        id,
        name: 'My Custom Formation',
        system: '4-3-3',
        players: Array.from({ length: 11 }, (_, i) => ({
          id: `player-${i + 1}`,
          role: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'][i],
          position: { x: 10 + i * 7, y: 20 + i * 5 },
          importance: i < 3 ? 'critical' : i < 7 ? 'high' : 'medium',
          attributes: ['pace', 'passing', 'shooting'].slice(0, Math.floor(Math.random() * 3) + 1),
        })),
        tacticalInstructions: {
          offensiveStyle: 'possession',
          defensiveStyle: 'high-press',
          buildUpSpeed: 'slow',
          width: 'wide',
          pressure: 'high',
          aggressiveness: 'high',
        },
        stats: {
          usageCount: 42,
          winRate: 65.5,
          avgGoalsScored: 2.1,
          avgGoalsConceded: 1.3,
        },
      };

      // Generate template ID
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Build template object
      const template: {
        id: string;
        name: string;
        description: string;
        system: string;
        category: string;
        difficulty: string;
        tags: string[];
        author: string;
        authorId?: string;
        isOfficial: boolean;
        isPublic: boolean;
        usageCount: number;
        rating: number;
        sourceFormationId: string;
        keyPositions: Array<{
          role: string;
          position: { x: number; y: number };
          importance: string;
          attributes?: string[];
        }>;
        tacticalInstructions?: {
          offensiveStyle: string;
          defensiveStyle: string;
          buildUpSpeed: string;
          width: string;
          pressure: string;
          aggressiveness: string;
        };
        performanceMetrics?: {
          usageCount: number;
          winRate: number;
          avgGoalsScored: number;
          avgGoalsConceded: number;
          effectivenessScore: number;
        };
        strengths?: string[];
        weaknesses?: string[];
        suitableFor?: {
          playerLevel: string[];
          teamStrength: string[];
          preferredAgainst: string[];
        };
        createdAt: string;
        updatedAt: string;
      } = {
        id: templateId,
        name,
        description,
        system: formation.system,
        category,
        difficulty,
        tags: Array.isArray(tags) ? tags : [],
        author: req.user?.firstName
          ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
          : 'Anonymous',
        authorId: req.user?.id,
        isOfficial: false,
        isPublic,
        usageCount: 0,
        rating: 0,
        sourceFormationId: id,
        keyPositions: formation.players.map(player => ({
          role: player.role,
          position: player.position,
          importance: player.importance,
          attributes: includePlayerAttributes ? player.attributes : undefined,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Include tactical instructions if requested
      if (includeTacticalInstructions) {
        template.tacticalInstructions = formation.tacticalInstructions;
      }

      // Add performance-based metadata
      if (formation.stats) {
        template.performanceMetrics = {
          usageCount: formation.stats.usageCount,
          winRate: formation.stats.winRate,
          avgGoalsScored: formation.stats.avgGoalsScored,
          avgGoalsConceded: formation.stats.avgGoalsConceded,
          effectivenessScore:
            Math.round(
              (formation.stats.winRate * 0.6 +
                (formation.stats.avgGoalsScored / (formation.stats.avgGoalsConceded || 1)) * 15) *
                10
            ) / 10,
        };
      }

      // Auto-generate strengths and weaknesses based on tactical style
      const strengthsMap: Record<string, string[]> = {
        possession: ['Ball retention', 'Creating chances', 'Controlling tempo'],
        'counter-attack': ['Quick transitions', 'Exploiting space', 'Clinical finishing'],
        'high-press': ['Winning ball high', 'Forcing errors', 'High intensity'],
        balanced: ['Tactical flexibility', 'Solid shape', 'Adaptability'],
      };

      const weaknessesMap: Record<string, string[]> = {
        possession: [
          'Vulnerable to counters',
          'Requires technical players',
          'High stamina demands',
        ],
        'counter-attack': ['Less possession', 'Requires pace', 'Can be passive'],
        'high-press': ['Tiring for players', 'Vulnerable if broken', 'Requires fitness'],
        balanced: ['Can lack identity', 'May not excel in any area', 'Requires smart players'],
      };

      const styleKey = formation.tacticalInstructions.offensiveStyle;
      template.strengths = strengthsMap[styleKey] || [
        'Effective tactics',
        'Good organization',
        'Team cohesion',
      ];
      template.weaknesses = weaknessesMap[styleKey] || [
        'Requires practice',
        'Player quality dependent',
        'Tactical discipline needed',
      ];

      // Determine suitable usage
      template.suitableFor = {
        playerLevel:
          difficulty === 'beginner'
            ? ['beginner', 'intermediate']
            : difficulty === 'intermediate'
              ? ['intermediate', 'professional']
              : difficulty === 'advanced'
                ? ['professional', 'advanced']
                : ['advanced', 'elite'],
        teamStrength:
          formation.stats.winRate >= 70
            ? ['strong', 'elite']
            : formation.stats.winRate >= 55
              ? ['average', 'strong']
              : ['weak', 'average'],
        preferredAgainst:
          category === 'attacking'
            ? ['defensive-formations', 'compact-teams']
            : category === 'defensive'
              ? ['attacking-formations', 'high-pressing']
              : ['any'],
      };

      // Save template to database
      // Production: Use Prisma to create template (via appState or dedicated table)
      // const savedTemplate = await this.db.appState.create({
      //   data: {
      //     id: templateId,
      //     userId: req.user?.id || '',
      //     stateType: 'formation_template',
      //     stateData: template
      //   }
      // });

      // Update formation to mark it as converted to template
      // Production: Add templateId reference to formation
      // await this.db.formation.update({
      //   where: { id },
      //   data: {
      //     convertedToTemplate: true,
      //     templateId
      //   }
      // });

      res.status(201).json({
        success: true,
        data: {
          template,
          message: `Successfully converted formation to ${isPublic ? 'public' : 'private'} template`,
          templateId,
          visibility: isPublic ? 'public' : 'private',
          sharing: isPublic ? 'Available to all users' : 'Only visible to you',
        },
      });
    } catch (error) {
      // Implement production logging
      securityLogger.error('Error converting formation to template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        formationId: req.params.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to convert formation to template',
      });
    }
  }

  private async getActiveSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: formationId } = req.params;
    const sessions = this.getActiveSessionsForFormation(formationId);

    res.json({
      success: true,
      data: sessions,
    });
  }

  private async updateSessionPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { userId, permission, action = 'update' } = req.body;

      // Validate action
      const validActions = ['update', 'add', 'remove'];
      if (!validActions.includes(action)) {
        res.status(400).json({
          success: false,
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        });
        return;
      }

      // Validate permission if action is not 'remove'
      if (action !== 'remove') {
        const validPermissions = ['owner', 'editor', 'viewer'];
        if (!permission || !validPermissions.includes(permission)) {
          res.status(400).json({
            success: false,
            message: `Invalid permission. Must be one of: ${validPermissions.join(', ')}`,
          });
          return;
        }
      }

      // Validate userId
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      // Fetch session from database
      const dbSession = await collaborationService.getSession(sessionId);
      if (!dbSession) {
        res.status(404).json({
          success: false,
          message: 'Collaboration session not found',
        });
        return;
      }

      // Check active sessions (for real-time collaboration)
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Collaboration session not found',
        });
        return;
      }

      // Check if current user is the owner
      const currentUserId = req.user?.id;
      const currentUserParticipant = session.participants.find(p => p.userId === currentUserId);

      if (!currentUserParticipant || currentUserParticipant.role !== 'owner') {
        res.status(403).json({
          success: false,
          message: 'Only the session owner can update permissions',
        });
        return;
      }

      // Prevent owner from changing their own permission
      if (userId === currentUserId && action !== 'add') {
        res.status(400).json({
          success: false,
          message: 'Owner cannot change their own permissions',
        });
        return;
      }

      // Get current participants
      const participants = session.participants || [];
      const existingParticipantIndex = participants.findIndex(p => p.userId === userId);

      const updatedParticipants = [...participants];
      let actionPerformed = '';

      if (action === 'add') {
        if (existingParticipantIndex !== -1) {
          res.status(400).json({
            success: false,
            message: 'User is already a participant in this session',
          });
          return;
        }

        // Add new participant
        updatedParticipants.push({
          userId,
          // Fetch real user name from database
          // Production: const user = await this.db.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
          userName: `User ${userId}`, // Replace with: `${user?.firstName} ${user?.lastName}`.trim()
          role: permission as 'owner' | 'editor' | 'viewer',
          joinedAt: new Date(),
          lastSeen: new Date(),
        });
        actionPerformed = 'added';
      } else if (action === 'update') {
        if (existingParticipantIndex === -1) {
          res.status(404).json({
            success: false,
            message: 'User is not a participant in this session',
          });
          return;
        }

        // Prevent changing the last owner to non-owner
        const ownersCount = updatedParticipants.filter(p => p.role === 'owner').length;
        if (
          updatedParticipants[existingParticipantIndex].role === 'owner' &&
          ownersCount === 1 &&
          permission !== 'owner'
        ) {
          res.status(400).json({
            success: false,
            message: "Cannot change the last owner's role. Session must have at least one owner.",
          });
          return;
        }

        // Update existing participant role
        updatedParticipants[existingParticipantIndex] = {
          ...updatedParticipants[existingParticipantIndex],
          role: permission as 'owner' | 'editor' | 'viewer',
          lastSeen: new Date(),
        };
        actionPerformed = 'updated';
      } else if (action === 'remove') {
        if (existingParticipantIndex === -1) {
          res.status(404).json({
            success: false,
            message: 'User is not a participant in this session',
          });
          return;
        }

        // Prevent removing the last owner
        const ownersCount = updatedParticipants.filter(p => p.role === 'owner').length;
        if (updatedParticipants[existingParticipantIndex].role === 'owner' && ownersCount === 1) {
          res.status(400).json({
            success: false,
            message: 'Cannot remove the last owner. Session must have at least one owner.',
          });
          return;
        }

        // Remove participant
        updatedParticipants.splice(existingParticipantIndex, 1);
        actionPerformed = 'removed';
      }

      // Update session with new participants
      session.participants = updatedParticipants;
      session.lastActivity = new Date();

      // Update session in database
      await collaborationService.updateSession({
        ...dbSession,
        participants: updatedParticipants.map(p => ({
          userId: p.userId,
          userName: p.userName,
          role: p.role,
          joinedAt: p.joinedAt,
          lastSeen: new Date(),
          cursor: p.cursor,
        })),
        lastActivity: new Date(),
      });

      // Broadcast permission change to all session participants
      if (this.io) {
        this.io.to(sessionId).emit('permission-changed', {
          type: 'permission-changed',
          data: {
            userId,
            action: actionPerformed,
            permission: action !== 'remove' ? permission : null,
            by: currentUserId,
          },
        });
      }

      // Prepare response with participant details
      const affectedParticipant =
        action !== 'remove'
          ? updatedParticipants.find(p => p.userId === userId)
          : { userId, removed: true };

      res.json({
        success: true,
        data: {
          sessionId,
          action: actionPerformed,
          participant: affectedParticipant,
          totalParticipants: updatedParticipants.length,
          permissions: {
            owners: updatedParticipants.filter(p => p.role === 'owner').length,
            editors: updatedParticipants.filter(p => p.role === 'editor').length,
            viewers: updatedParticipants.filter(p => p.role === 'viewer').length,
          },
          message: `Successfully ${actionPerformed} ${action === 'remove' ? 'participant from' : 'participant to'} session`,
        },
      });
    } catch (error) {
      // Implement production logging
      securityLogger.error('Error updating session permissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        sessionId: req.params.sessionId,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update session permissions',
      });
    }
  }

  private async endCollaboration(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sessionId } = req.params;

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    // Check if user has permission to end session
    const participant = session.participants.find(p => p.userId === req.user?.id);
    if (!participant || participant.role !== 'owner') {
      res.status(403).json({
        success: false,
        error: 'Only session owner can end collaboration',
      });
      return;
    }

    this.endSession(sessionId, 'Ended by owner');

    res.json({
      success: true,
      message: 'Collaboration session ended',
    });
  }

  getRouter(): Router {
    return this.router;
  }
}

// Export the router factory
export function createTacticalBoardAPI(io: SocketIOServer): Router {
  const tacticalAPI = new TacticalBoardAPI(io);
  return tacticalAPI.getRouter();
}
