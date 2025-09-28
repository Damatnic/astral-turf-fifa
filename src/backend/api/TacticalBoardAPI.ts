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
    this.io.on('connection', (socket) => {
      socket.on('join_tactical_session', (data) => {
        this.handleJoinSession(socket, data);
      });

      socket.on('leave_tactical_session', (data) => {
        this.handleLeaveSession(socket, data);
      });

      socket.on('player_position_update', (data) => {
        this.handlePlayerPositionUpdate(socket, data);
      });

      socket.on('formation_update', (data) => {
        this.handleFormationUpdate(socket, data);
      });

      socket.on('tactical_instruction_update', (data) => {
        this.handleTacticalInstructionUpdate(socket, data);
      });

      socket.on('cursor_move', (data) => {
        this.handleCursorMove(socket, data);
      });

      socket.on('element_select', (data) => {
        this.handleElementSelect(socket, data);
      });

      socket.on('conflict_resolution', (data) => {
        this.handleConflictResolution(socket, data);
      });

      socket.on('request_formation_lock', (data) => {
        this.handleFormationLockRequest(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private startCleanupTasks(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);

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
        sortOrder = 'desc'
      } = req.query;

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
      const countResult = await phoenixPool.query(`
        SELECT COUNT(*) as total FROM formations ${whereClause}
      `, params);

      // Get formations
      const result = await phoenixPool.query(`
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as creator_name,
          t.name as team_name,
          (SELECT COUNT(*) FROM collaboration_sessions cs WHERE cs.formation_id = f.id AND cs.is_active = true) as active_sessions
        FROM formations f
        LEFT JOIN users u ON f.created_by = u.id
        LEFT JOIN teams t ON f.team_id = t.id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

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
            hasPrev: Number(page) > 1
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch formations',
        details: error.message
      });
    }
  }

  private async getFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeHistory = false } = req.query;

      const result = await phoenixPool.query(`
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as creator_name,
          t.name as team_name
        FROM formations f
        LEFT JOIN users u ON f.created_by = u.id
        LEFT JOIN teams t ON f.team_id = t.id
        WHERE f.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found'
        });
        return;
      }

      const formation = result.rows[0];

      // Check access permissions
      if (!this.checkFormationAccess(formation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Increment view count
      await phoenixPool.query(`
        UPDATE formations 
        SET metadata = jsonb_set(metadata, '{usage,views}', 
          to_jsonb(COALESCE((metadata->'usage'->>'views')::int, 0) + 1))
        WHERE id = $1
      `, [id]);

      let history = null;
      if (includeHistory === 'true') {
        const historyResult = await phoenixPool.query(`
          SELECT version, created_at, created_by, changes
          FROM formation_history 
          WHERE formation_id = $1 
          ORDER BY version DESC 
          LIMIT 10
        `, [id]);
        history = historyResult.rows;
      }

      res.json({
        success: true,
        data: {
          formation,
          history,
          activeSessions: this.getActiveSessionsForFormation(id)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch formation',
        details: error.message
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
        metadata = {}
      } = req.body;

      // Validate formation data
      if (!this.validateFormationData(formation)) {
        res.status(400).json({
          success: false,
          error: 'Invalid formation data'
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
        ...metadata
      };

      const result = await phoenixPool.query(`
        INSERT INTO formations (
          id, name, description, team_id, created_by, is_public, is_template,
          formation, metadata, created_at, updated_at, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 1)
        RETURNING *
      `, [
        formationId,
        name,
        description,
        teamId,
        req.user?.id,
        isPublic,
        isTemplate,
        JSON.stringify(formation),
        JSON.stringify(defaultMetadata),
        now
      ]);

      // Create initial history entry
      await this.createHistoryEntry(formationId, 1, req.user?.id, 'Formation created', formation);

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create formation',
        details: error.message
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
          error: 'Formation not found'
        });
        return;
      }

      const currentFormation = currentResult.rows[0];

      // Check permissions
      if (!this.checkFormationEditAccess(currentFormation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Edit access denied'
        });
        return;
      }

      // Check for active collaboration sessions
      const activeSession = this.getActiveSessionForFormation(id);
      if (activeSession && !this.canEditInSession(activeSession, req.user?.id)) {
        res.status(409).json({
          success: false,
          error: 'Formation is locked by another user',
          data: { sessionId: activeSession.id }
        });
        return;
      }

      // Build update query dynamically
      const allowedFields = ['name', 'description', 'team_id', 'is_public', 'formation', 'metadata'];
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(field => {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(field === 'formation' || field === 'metadata' 
            ? JSON.stringify(updates[field]) 
            : updates[field]
          );
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
        return;
      }

      // Add updated_at and increment version
      updateFields.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;

      updateFields.push(`version = version + 1`);

      const result = await phoenixPool.query(`
        UPDATE formations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, [...values, id]);

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
          version: result.rows[0].version
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update formation',
        details: error.message
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
          error: 'Formation not found'
        });
        return;
      }

      const formation = result.rows[0];

      // Check permissions (only creator or admin can delete)
      if (formation.created_by !== req.user?.id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Delete access denied'
        });
        return;
      }

      // End any active collaboration sessions
      const activeSessions = Array.from(this.activeSessions.values())
        .filter(session => session.formationId === id);
      
      activeSessions.forEach(session => {
        this.endSession(session.id, 'Formation deleted');
      });

      // Soft delete (mark as deleted instead of actual deletion)
      await phoenixPool.query(`
        UPDATE formations 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [id]);

      res.json({
        success: true,
        message: 'Formation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete formation',
        details: error.message
      });
    }
  }

  // Collaboration methods

  private async startCollaboration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: formationId } = req.params;
      const { permissions = {} } = req.body;

      // Check if formation exists and user has access
      const formationResult = await phoenixPool.query(
        'SELECT * FROM formations WHERE id = $1', 
        [formationId]
      );

      if (formationResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Formation not found'
        });
        return;
      }

      const formation = formationResult.rows[0];
      if (!this.checkFormationAccess(formation, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Check if there's already an active session
      let existingSession = this.getActiveSessionForFormation(formationId);
      
      if (existingSession) {
        // Add user to existing session
        const participant: Participant = {
          userId: req.user?.id || '',
          userName: `${req.user?.firstName} ${req.user?.lastName}`,
          role: formation.created_by === req.user?.id ? 'owner' : 'editor',
          joinedAt: new Date(),
          lastSeen: new Date()
        };

        existingSession.participants.push(participant);
        existingSession.lastActivity = new Date();

        // Notify other participants
        this.broadcastToSession(existingSession.id, 'participant_joined', {
          participant,
          sessionId: existingSession.id
        });

        res.json({
          success: true,
          data: { sessionId: existingSession.id, session: existingSession }
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
        ...permissions
      };

      const session: CollaborationSession = {
        id: sessionId,
        formationId,
        participants: [{
          userId: req.user?.id || '',
          userName: `${req.user?.firstName} ${req.user?.lastName}`,
          role: 'owner',
          joinedAt: new Date(),
          lastSeen: new Date()
        }],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
        permissions: defaultPermissions
      };

      this.activeSessions.set(sessionId, session);

      res.json({
        success: true,
        data: { sessionId, session }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to start collaboration',
        details: error.message
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
      timestamp: new Date()
    });

    // Send current session state
    socket.emit('session_state', {
      session,
      formationData: this.getFormationData(session.formationId)
    });
  }

  private handleLeaveSession(socket: Socket, data: { sessionId: string; userId: string }): void {
    socket.leave(data.sessionId);
    
    // Notify others
    socket.to(data.sessionId).emit('participant_activity', {
      userId: data.userId,
      type: 'left',
      timestamp: new Date()
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
      applied: false
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
      timestamp: update.timestamp
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
      applied: false
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
      timestamp: update.timestamp
    });
  }

  private handleCursorMove(socket: Socket, data: { position: Position }): void {
    const sessionId = socket.data.sessionId;
    const userId = socket.data.userId;

    if (!sessionId) return;

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
      timestamp: new Date()
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
      resolvedBy: userId
    });

    // Remove from queue
    this.conflictQueue.set(sessionId, conflicts.filter(c => c.conflictId !== data.conflictId));
  }

  // Helper methods

  private validateFormationData(formation: any): boolean {
    if (!formation || typeof formation !== 'object') return false;
    if (!formation.system || typeof formation.system !== 'string') return false;
    if (!Array.isArray(formation.players)) return false;
    
    // Validate players array
    return formation.players.every((player: any) => {
      return player.id && 
             player.position && 
             typeof player.position.x === 'number' && 
             typeof player.position.y === 'number' &&
             player.role &&
             player.role.primary;
    });
  }

  private checkFormationAccess(formation: any, user: any): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (formation.is_public) return true;
    if (formation.created_by === user.id) return true;
    
    // Check team access for coaches
    if (user.role === 'coach' && formation.team_id) {
      // Would check if user is coach of the team
      return true; // Simplified for this example
    }

    return false;
  }

  private checkFormationEditAccess(formation: any, user: any): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (formation.created_by === user.id) return true;
    
    // Check if user is coach of the team
    if (user.role === 'coach' && formation.team_id) {
      return true; // Simplified for this example
    }

    return false;
  }

  private getActiveSessionsForFormation(formationId: string): CollaborationSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.formationId === formationId && session.isActive);
  }

  private getActiveSessionForFormation(formationId: string): CollaborationSession | undefined {
    return Array.from(this.activeSessions.values())
      .find(session => session.formationId === formationId && session.isActive);
  }

  private canEditInSession(session: CollaborationSession, userId?: string): boolean {
    if (!userId) return false;
    
    const participant = session.participants.find(p => p.userId === userId);
    if (!participant) return false;
    
    return participant.role === 'owner' || 
           (participant.role === 'editor' && session.permissions.allowEditing);
  }

  private canUserEdit(sessionId: string, userId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    return this.canEditInSession(session, userId);
  }

  private checkPositionConflict(sessionId: string, data: any): ConflictResolution | null {
    // Check if multiple users are trying to move the same player
    const pendingUpdates = this.pendingUpdates.get(sessionId) || [];
    const recentUpdates = pendingUpdates.filter(
      update => update.type === 'player_move' && 
                 update.data.playerId === data.playerId &&
                 Date.now() - update.timestamp.getTime() < 1000 // Within last second
    );

    if (recentUpdates.length > 0) {
      return {
        conflictId: uuidv4(),
        type: 'position_conflict',
        participants: [recentUpdates[0].userId, data.userId],
        data: { playerId: data.playerId, positions: [recentUpdates[0].data, data] }
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
      await phoenixPool.query(`
        INSERT INTO formation_history (
          formation_id, version, created_at, created_by, changes, formation_data
        ) VALUES ($1, $2, NOW(), $3, $4, $5)
      `, [formationId, version, userId, changes, JSON.stringify(formationData)]);
    } catch (error) {
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
        if (!conflict.resolution && 
            Date.now() - conflict.data.timestamp > 30000) { // 30 seconds timeout
          
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
    // Implementation would use AI/ML to automatically assign players to positions
    res.json({ success: true, message: 'Auto-assignment feature not implemented yet' });
  }

  private async optimizeFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would optimize formation based on player attributes and tactics
    res.json({ success: true, message: 'Formation optimization feature not implemented yet' });
  }

  private async analyzeFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would provide tactical analysis
    res.json({ success: true, message: 'Formation analysis feature not implemented yet' });
  }

  private async exportFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would export formation in various formats
    res.json({ success: true, message: 'Export feature not implemented yet' });
  }

  private async importFormation(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would import formation from file
    res.json({ success: true, message: 'Import feature not implemented yet' });
  }

  private async getFormationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would return formation version history
    res.json({ success: true, message: 'History feature not implemented yet' });
  }

  private async revertToVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would revert formation to specific version
    res.json({ success: true, message: 'Revert feature not implemented yet' });
  }

  private async getPositionHeatmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would generate position heatmap
    res.json({ success: true, message: 'Heatmap feature not implemented yet' });
  }

  private async getEffectivenessMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would analyze formation effectiveness
    res.json({ success: true, message: 'Effectiveness metrics feature not implemented yet' });
  }

  private async getPopularFormations(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would return most popular formations
    res.json({ success: true, message: 'Popular formations feature not implemented yet' });
  }

  private async getFormationTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would return formation templates
    res.json({ success: true, message: 'Templates feature not implemented yet' });
  }

  private async convertToTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would convert formation to template
    res.json({ success: true, message: 'Convert to template feature not implemented yet' });
  }

  private async getActiveSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: formationId } = req.params;
    const sessions = this.getActiveSessionsForFormation(formationId);
    
    res.json({
      success: true,
      data: sessions
    });
  }

  private async updateSessionPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Implementation would update session permissions
    res.json({ success: true, message: 'Update permissions feature not implemented yet' });
  }

  private async endCollaboration(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sessionId } = req.params;
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Check if user has permission to end session
    const participant = session.participants.find(p => p.userId === req.user?.id);
    if (!participant || participant.role !== 'owner') {
      res.status(403).json({
        success: false,
        error: 'Only session owner can end collaboration'
      });
      return;
    }

    this.endSession(sessionId, 'Ended by owner');

    res.json({
      success: true,
      message: 'Collaboration session ended'
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

// Export types
export type {
  Formation,
  FormationData,
  PlayerPosition,
  Position,
  PlayerRole,
  PlayStyle,
  PlayerInstructions,
  MovementPattern,
  Connection,
  TacticalInstructions,
  SetPieceConfiguration,
  FormationMetadata,
  CollaborationSession,
  Participant,
  SessionPermissions,
  RealTimeUpdate,
  ConflictResolution
};