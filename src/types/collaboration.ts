/**
 * Real-time Collaboration Type Definitions
 * Defines structures for WebSocket-based collaborative editing
 */

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeenAt: number;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  users: CollaborationUser[];
  isActive: boolean;
  permissions: SessionPermissions;
}

export interface SessionPermissions {
  allowEdit: boolean;
  allowInvite: boolean;
  allowKick: boolean;
  isPublic: boolean;
}

export type CollaborationEventType =
  | 'user-joined'
  | 'user-left'
  | 'cursor-move'
  | 'player-move'
  | 'player-update'
  | 'formation-change'
  | 'undo'
  | 'redo'
  | 'chat-message'
  | 'ping'
  | 'pong';

export interface CollaborationEvent {
  type: CollaborationEventType;
  userId: string;
  sessionId: string;
  timestamp: number;
  data: unknown;
}

export interface PlayerMoveEvent {
  playerId: string;
  position: { x: number; y: number };
  userId: string;
  timestamp: number;
}

export interface PlayerUpdateEvent {
  playerId: string;
  updates: Record<string, unknown>;
  userId: string;
  timestamp: number;
}

export interface FormationChangeEvent {
  formationId: string;
  userId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  latency?: number;
  lastPingAt?: number;
}

export interface OperationTransform {
  id: string;
  type: 'move' | 'update' | 'delete' | 'create';
  playerId: string;
  data: unknown;
  userId: string;
  timestamp: number;
  vectorClock: Record<string, number>;
}
