/**
 * Real-Time Data Synchronization Service
 *
 * Provides comprehensive cloud sync, real-time updates, and multi-device continuity
 * for the Astral Turf Soccer Management Application
 */

import { io, Socket } from 'socket.io-client';
import type { RootState, Action } from '../types';
import { encrypt, decrypt } from './securityService';
import { v4 as uuidv4 } from 'uuid';

export interface SyncEvent {
  id: string;
  type: 'STATE_UPDATE' | 'PLAYER_UPDATE' | 'FORMATION_CHANGE' | 'TACTICAL_UPDATE';
  payload: any;
  timestamp: number;
  userId: string;
  deviceId: string;
}

export interface SyncConflict {
  id: string;
  type: 'MERGE_REQUIRED' | 'VERSION_MISMATCH' | 'DATA_CONFLICT';
  localData: any;
  remoteData: any;
  timestamp: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'tablet' | 'mobile';
  lastSeen: number;
  isOnline: boolean;
}

class SyncService {
  private socket: Socket | null = null;
  private isConnected = false;
  private deviceId: string;
  private userId: string | null = null;
  private syncQueue: SyncEvent[] = [];
  private conflictQueue: SyncConflict[] = [];
  private connectedDevices: Map<string, DeviceInfo> = new Map();
  private lastSyncTimestamp = 0;

  // Event listeners
  private onStateUpdateCallback?: (action: Action) => void;
  private onConflictCallback?: (conflict: SyncConflict) => void;
  private onDeviceUpdateCallback?: (devices: DeviceInfo[]) => void;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Initialize real-time sync connection
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    this.userId = userId;

    const syncServerUrl = process.env.NODE_ENV === 'production'
      ? 'https://sync.astralturf.com'
      : 'http://localhost:3001';

    this.socket = io(syncServerUrl, {
      auth: {
        token: authToken,
        userId: userId,
        deviceId: this.deviceId,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: 3,
    });

    this.setupSocketEventListeners();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket initialization failed'));
        return;
      }

      this.socket.on('connect', () => {
        console.log('🔄 Real-time sync connected');
        this.isConnected = true;
        this.processSyncQueue();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Sync connection error:', error);
        reject(error);
      });

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Sync connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Sync state changes to other devices
   */
  async syncState(action: Action, state: RootState): Promise<void> {
    if (!this.isConnected || !this.socket || !this.userId) {
      // Queue for later sync
      this.queueSyncEvent('STATE_UPDATE', { action, state });
      return;
    }

    const syncEvent: SyncEvent = {
      id: uuidv4(),
      type: 'STATE_UPDATE',
      payload: {
        action,
        partialState: this.extractRelevantState(action, state),
      },
      timestamp: Date.now(),
      userId: this.userId,
      deviceId: this.deviceId,
    };

    try {
      const encryptedPayload = await encrypt(JSON.stringify(syncEvent.payload));

      this.socket.emit('sync_state', {
        ...syncEvent,
        payload: encryptedPayload,
      });

      this.lastSyncTimestamp = syncEvent.timestamp;

    } catch (error) {
      console.error('❌ Failed to sync state:', error);
      this.queueSyncEvent('STATE_UPDATE', { action, state });
    }
  }

  /**
   * Sync player data changes across devices
   */
  async syncPlayerUpdate(playerId: string, playerData: any): Promise<void> {
    if (!this.isConnected || !this.socket) {
      this.queueSyncEvent('PLAYER_UPDATE', { playerId, playerData });
      return;
    }

    const syncEvent: SyncEvent = {
      id: uuidv4(),
      type: 'PLAYER_UPDATE',
      payload: { playerId, playerData },
      timestamp: Date.now(),
      userId: this.userId!,
      deviceId: this.deviceId,
    };

    try {
      const encryptedPayload = await encrypt(JSON.stringify(syncEvent.payload));

      this.socket.emit('sync_player', {
        ...syncEvent,
        payload: encryptedPayload,
      });

    } catch (error) {
      console.error('❌ Failed to sync player update:', error);
      this.queueSyncEvent('PLAYER_UPDATE', { playerId, playerData });
    }
  }

  /**
   * Sync formation and tactical changes
   */
  async syncTacticalUpdate(formationId: string, tacticsData: any): Promise<void> {
    if (!this.isConnected || !this.socket) {
      this.queueSyncEvent('TACTICAL_UPDATE', { formationId, tacticsData });
      return;
    }

    const syncEvent: SyncEvent = {
      id: uuidv4(),
      type: 'TACTICAL_UPDATE',
      payload: { formationId, tacticsData },
      timestamp: Date.now(),
      userId: this.userId!,
      deviceId: this.deviceId,
    };

    try {
      const encryptedPayload = await encrypt(JSON.stringify(syncEvent.payload));

      this.socket.emit('sync_tactics', {
        ...syncEvent,
        payload: encryptedPayload,
      });

    } catch (error) {
      console.error('❌ Failed to sync tactical update:', error);
      this.queueSyncEvent('TACTICAL_UPDATE', { formationId, tacticsData });
    }
  }

  /**
   * Request full state sync from server
   */
  async requestFullSync(): Promise<RootState | null> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to sync server'));
        return;
      }

      this.socket.emit('request_full_sync', { deviceId: this.deviceId });

      this.socket.once('full_sync_response', async (data) => {
        try {
          const decryptedData = await decrypt(data.state);
          const state = JSON.parse(decryptedData);
          resolve(state);
        } catch (error) {
          reject(error);
        }
      });

      setTimeout(() => {
        reject(new Error('Full sync request timeout'));
      }, 15000);
    });
  }

  /**
   * Handle sync conflicts with merge strategies
   */
  async resolveConflict(conflictId: string, strategy: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict || !this.socket) {return;}

    let resolvedData: any;

    switch (strategy) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'remote':
        resolvedData = conflict.remoteData;
        break;
      case 'merge':
        resolvedData = this.mergeConflictData(conflict.localData, conflict.remoteData);
        break;
    }

    this.socket.emit('resolve_conflict', {
      conflictId,
      resolvedData,
      strategy,
    });

    // Remove from conflict queue
    this.conflictQueue = this.conflictQueue.filter(c => c.id !== conflictId);
  }

  /**
   * Get list of connected devices
   */
  getConnectedDevices(): DeviceInfo[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Disconnect from sync service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.connectedDevices.clear();
  }

  /**
   * Check if sync is available (online)
   */
  isSyncAvailable(): boolean {
    return this.isConnected && this.socket !== null;
  }

  /**
   * Get sync status information
   */
  getSyncStatus() {
    return {
      connected: this.isConnected,
      queueSize: this.syncQueue.length,
      conflictsCount: this.conflictQueue.length,
      lastSync: this.lastSyncTimestamp,
      connectedDevices: this.getConnectedDevices().length,
    };
  }

  // Event listener setters
  onStateUpdate(callback: (action: Action) => void): void {
    this.onStateUpdateCallback = callback;
  }

  onConflict(callback: (conflict: SyncConflict) => void): void {
    this.onConflictCallback = callback;
  }

  onDeviceUpdate(callback: (devices: DeviceInfo[]) => void): void {
    this.onDeviceUpdateCallback = callback;
  }

  // Private methods

  private setupSocketEventListeners(): void {
    if (!this.socket) {return;}

    // Handle incoming state updates from other devices
    this.socket.on('state_update', async (data: SyncEvent) => {
      try {
        const decryptedPayload = await decrypt(data.payload);
        const payload = JSON.parse(decryptedPayload);

        if (this.onStateUpdateCallback && data.deviceId !== this.deviceId) {
          this.onStateUpdateCallback(payload.action);
        }
      } catch (error) {
        console.error('❌ Failed to process incoming state update:', error);
      }
    });

    // Handle sync conflicts
    this.socket.on('sync_conflict', (conflict: SyncConflict) => {
      this.conflictQueue.push(conflict);
      if (this.onConflictCallback) {
        this.onConflictCallback(conflict);
      }
    });

    // Handle device connections/disconnections
    this.socket.on('device_update', (devices: DeviceInfo[]) => {
      this.connectedDevices.clear();
      devices.forEach(device => {
        this.connectedDevices.set(device.id, device);
      });

      if (this.onDeviceUpdateCallback) {
        this.onDeviceUpdateCallback(devices);
      }
    });

    // Handle reconnection
    this.socket.on('reconnect', () => {
      console.log('🔄 Sync reconnected, processing queued events');
      this.processSyncQueue();
    });

    // Handle disconnect
    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Sync disconnected:', reason);
      this.isConnected = false;
    });
  }

  private queueSyncEvent(type: SyncEvent['type'], payload: any): void {
    const syncEvent: SyncEvent = {
      id: uuidv4(),
      type,
      payload,
      timestamp: Date.now(),
      userId: this.userId || '',
      deviceId: this.deviceId,
    };

    this.syncQueue.push(syncEvent);

    // Keep queue size manageable
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-50);
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isConnected || !this.socket || this.syncQueue.length === 0) {
      return;
    }

    const eventsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const event of eventsToProcess) {
      try {
        const encryptedPayload = await encrypt(JSON.stringify(event.payload));

        this.socket.emit(`sync_${event.type.toLowerCase()}`, {
          ...event,
          payload: encryptedPayload,
        });
      } catch (error) {
        console.error('❌ Failed to process queued sync event:', error);
        // Re-queue failed events
        this.syncQueue.push(event);
      }
    }
  }

  private extractRelevantState(action: Action, state: RootState): Partial<RootState> {
    // Extract only relevant state based on action type
    switch (action.type) {
      case 'UPDATE_PLAYER':
      case 'ADD_PLAYER':
        return { tactics: { players: state.tactics.players } };

      case 'SET_ACTIVE_FORMATION':
      case 'ASSIGN_PLAYER_TO_SLOT':
        return { tactics: { activeFormationIds: state.tactics.activeFormationIds, formations: state.tactics.formations } };

      case 'SET_TEAM_TACTIC':
        return { tactics: { teamTactics: state.tactics.teamTactics } };

      default:
        return {};
    }
  }

  private mergeConflictData(localData: any, remoteData: any): any {
    // Smart merge strategy - prioritize most recent changes
    const merged = { ...localData };

    // Merge based on timestamps if available
    if (localData.timestamp && remoteData.timestamp) {
      if (remoteData.timestamp > localData.timestamp) {
        return { ...merged, ...remoteData };
      }
    }

    return merged;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('astral_turf_device_id');

    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('astral_turf_device_id', deviceId);
    }

    return deviceId;
  }
}

// Singleton instance
export const syncService = new SyncService();