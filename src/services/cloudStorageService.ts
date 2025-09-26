/**
 * Cloud Storage Service with Offline-First Architecture
 *
 * Provides robust cloud data storage, synchronization, and offline capabilities
 * with automatic conflict resolution and version management
 */

import Dexie, { Table } from 'dexie';
import { RootState } from '../types';
import { encrypt, decrypt } from './securityService';
import { v4 as uuidv4 } from 'uuid';

export interface StoredState {
  id: string;
  userId: string;
  deviceId: string;
  state: string; // encrypted state
  version: number;
  timestamp: number;
  checksum: string;
  isUploaded: boolean;
  conflictResolved: boolean;
}

export interface SyncLog {
  id: string;
  action: string;
  timestamp: number;
  success: boolean;
  error?: string;
  dataSize: number;
}

export interface BackupMetadata {
  id: string;
  userId: string;
  timestamp: number;
  version: number;
  size: number;
  description: string;
  isAutomatic: boolean;
}

class CloudStorageDatabase extends Dexie {
  states!: Table<StoredState>;
  syncLogs!: Table<SyncLog>;
  backups!: Table<BackupMetadata>;

  constructor() {
    super('AstralTurfCloudStorage');

    this.version(1).stores({
      states: '++id, userId, deviceId, timestamp, isUploaded',
      syncLogs: '++id, timestamp, success',
      backups: '++id, userId, timestamp, version',
    });
  }
}

export interface CloudConfig {
  endpoint: string;
  apiKey: string;
  region: string;
  bucket: string;
}

class CloudStorageService {
  private db = new CloudStorageDatabase();
  private currentUserId: string | null = null;
  private deviceId: string;
  private config: CloudConfig | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  // Event callbacks
  private onSyncCompleteCallback?: (success: boolean, error?: string) => void;
  private onConflictCallback?: (localState: RootState, remoteState: RootState) => void;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.setupOnlineDetection();
  }

  /**
   * Initialize cloud storage service
   */
  async initialize(userId: string, config: CloudConfig): Promise<void> {
    this.currentUserId = userId;
    this.config = config;

    // Initialize database
    await this.db.open();

    // // // // console.log('☁️ Cloud storage service initialized');
  }

  /**
   * Save state locally and sync to cloud
   */
  async saveState(state: RootState): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    try {
      const encryptedState = await encrypt(JSON.stringify(state));
      const checksum = await this.generateChecksum(encryptedState);

      const storedState: StoredState = {
        id: uuidv4(),
        userId: this.currentUserId,
        deviceId: this.deviceId,
        state: encryptedState,
        version: await this.getNextVersion(),
        timestamp: Date.now(),
        checksum,
        isUploaded: false,
        conflictResolved: false,
      };

      // Save locally first (offline-first)
      await this.db.states.add(storedState);

      // Sync to cloud if online
      if (this.isOnline && !this.syncInProgress) {
        await this.syncToCloud();
      }

      // // // // console.log('💾 State saved locally and queued for cloud sync');

    } catch (_error) {
      console.error('❌ Failed to save state:', _error);
      throw error;
    }
  }

  /**
   * Load latest state (local first, then cloud)
   */
  async loadState(): Promise<RootState | null> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    try {
      // Try local first
      const localState = await this.loadLocalState();

      // If online, check for newer cloud state
      if (this.isOnline && this.config) {
        const cloudState = await this.loadCloudState();

        if (cloudState && (!localState || cloudState.version > localState.version)) {
          // Cloud state is newer
          if (localState && localState.version !== cloudState.version) {
            // Potential conflict - let user decide
            if (this.onConflictCallback) {
              this.onConflictCallback(localState.state, cloudState.state);
            }
          }
          return cloudState.state;
        }
      }

      return localState?.state || null;

    } catch (_error) {
      console.error('❌ Failed to load state:', _error);
      return null;
    }
  }

  /**
   * Sync all pending changes to cloud
   */
  async syncToCloud(): Promise<void> {
    if (!this.config || !this.currentUserId || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingStates = await this.db.states
        .where({ userId: this.currentUserId, isUploaded: false })
        .toArray();

      for (const state of pendingStates) {
        await this.uploadStateToCloud(state);
      }

      await this.logSync('SYNC_TO_CLOUD', true, pendingStates.length);

      if (this.onSyncCompleteCallback) {
        this.onSyncCompleteCallback(true);
      }

      // // // // console.log(`☁️ Synced ${pendingStates.length} states to cloud`);

    } catch (_error) {
      await this.logSync('SYNC_TO_CLOUD', false, 0, error.message);

      if (this.onSyncCompleteCallback) {
        this.onSyncCompleteCallback(false, error.message);
      }

      console.error('❌ Cloud sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Create automatic backup
   */
  async createBackup(description: string = 'Automatic backup'): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not initialized');
    }

    try {
      const latestState = await this.loadLocalState();
      if (!latestState) {
        throw new Error('No state to backup');
      }

      const backupId = uuidv4();
      const backupData = {
        id: backupId,
        state: latestState.state,
        metadata: {
          userId: this.currentUserId,
          deviceId: this.deviceId,
          timestamp: Date.now(),
          version: latestState.version,
        },
      };

      // Save backup metadata locally
      const backupMetadata: BackupMetadata = {
        id: backupId,
        userId: this.currentUserId,
        timestamp: Date.now(),
        version: latestState.version,
        size: JSON.stringify(backupData).length,
        description,
        isAutomatic: description === 'Automatic backup',
      };

      await this.db.backups.add(backupMetadata);

      // Upload to cloud if online
      if (this.isOnline && this.config) {
        await this.uploadBackupToCloud(backupId, backupData);
      }

      // // // // console.log(`💾 Backup created: ${backupId}`);
      return backupId;

    } catch (_error) {
      console.error('❌ Backup creation failed:', _error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<RootState> {
    try {
      // Try local backup first
      const localBackup = await this.db.backups.get(backupId);

      if (!localBackup) {
        throw new Error('Backup not found');
      }

      // Load backup data from cloud
      if (this.isOnline && this.config) {
        const backupData = await this.downloadBackupFromCloud(backupId);
        return backupData.state;
      }

      throw new Error('Backup data not available offline');

    } catch (_error) {
      console.error('❌ Backup restoration failed:', _error);
      throw error;
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<BackupMetadata[]> {
    if (!this.currentUserId) {return [];}

    return this.db.backups
      .where({ userId: this.currentUserId })
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const logs = await this.db.syncLogs.toArray();
    const totalSyncs = logs.length;
    const successfulSyncs = logs.filter(log => log.success).length;
    const failedSyncs = totalSyncs - successfulSyncs;
    const lastSync = logs.length > 0 ? Math.max(...logs.map(log => log.timestamp)) : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
      lastSync,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Clean up old data
   */
  async cleanup(daysToKeep: number = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    await this.db.states.where('timestamp').below(cutoffTime).delete();
    await this.db.syncLogs.where('timestamp').below(cutoffTime).delete();
    await this.db.backups
      .where('timestamp')
      .below(cutoffTime)
      .and(backup => backup.isAutomatic)
      .delete();

    // // // // console.log(`🧹 Cleaned up data older than ${daysToKeep} days`);
  }

  // Event listener setters
  onSyncComplete(callback: (success: boolean, error?: string) => void): void {
    this.onSyncCompleteCallback = callback;
  }

  onConflict(callback: (localState: RootState, remoteState: RootState) => void): void {
    this.onConflictCallback = callback;
  }

  // Private methods

  private async loadLocalState(): Promise<{ state: RootState; version: number } | null> {
    if (!this.currentUserId) {return null;}

    const latestState = await this.db.states
      .where({ userId: this.currentUserId })
      .reverse()
      .sortBy('timestamp')
      .then(states => states[0]);

    if (!latestState) {return null;}

    try {
      const decryptedState = await decrypt(latestState.state);
      const state = JSON.parse(decryptedState);
      return { state, version: latestState.version };
    } catch (_error) {
      console.error('❌ Failed to decrypt local state:', _error);
      return null;
    }
  }

  private async loadCloudState(): Promise<{ state: RootState; version: number } | null> {
    if (!this.config || !this.currentUserId) {return null;}

    try {
      const response = await fetch(`${this.config.endpoint}/states/${this.currentUserId}/latest`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cloud request failed: ${response.status}`);
      }

      const data = await response.json();
      const decryptedState = await decrypt(data.state);
      const state = JSON.parse(decryptedState);

      return { state, version: data.version };

    } catch (_error) {
      console.error('❌ Failed to load cloud state:', _error);
      return null;
    }
  }

  private async uploadStateToCloud(storedState: StoredState): Promise<void> {
    if (!this.config) {return;}

    const response = await fetch(`${this.config.endpoint}/states`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: storedState.id,
        userId: storedState.userId,
        deviceId: storedState.deviceId,
        state: storedState.state,
        version: storedState.version,
        timestamp: storedState.timestamp,
        checksum: storedState.checksum,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    // Mark as uploaded
    await this.db.states.update(storedState.id, { isUploaded: true });
  }

  private async uploadBackupToCloud(backupId: string, backupData: unknown): Promise<void> {
    if (!this.config) {return;}

    const response = await fetch(`${this.config.endpoint}/backups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: backupId,
        data: await encrypt(JSON.stringify(backupData)),
      }),
    });

    if (!response.ok) {
      throw new Error(`Backup upload failed: ${response.status}`);
    }
  }

  private async downloadBackupFromCloud(backupId: string): Promise<unknown> {
    if (!this.config) {throw new Error('Cloud config not available');}

    const response = await fetch(`${this.config.endpoint}/backups/${backupId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backup download failed: ${response.status}`);
    }

    const data = await response.json();
    const decryptedData = await decrypt(data.data);
    return JSON.parse(decryptedData);
  }

  private async generateChecksum(data: string): Promise<string> {
    if (typeof TextEncoder === 'undefined' || typeof crypto === 'undefined') {
      return 'checksum-unavailable';
    }
    const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    if (!encoder) return 'checksum-unavailable';
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await (typeof crypto !== 'undefined' ? crypto.subtle.digest('SHA-256', dataBuffer) : new ArrayBuffer(0));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getNextVersion(): Promise<number> {
    if (!this.currentUserId) {return 1;}

    const latestState = await this.db.states
      .where({ userId: this.currentUserId })
      .reverse()
      .sortBy('version')
      .then(states => states[0]);

    return (latestState?.version || 0) + 1;
  }

  private async logSync(action: string, success: boolean, dataSize: number, error?: string): Promise<void> {
    const log: SyncLog = {
      id: uuidv4(),
      action,
      timestamp: Date.now(),
      success,
      error,
      dataSize,
    };

    await this.db.syncLogs.add(log);
  }

  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      // // // // console.log('🌐 Connection restored - initiating sync');
      this.syncToCloud();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      // // // // console.log('📡 Connection lost - entering offline mode');
    });
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
export const cloudStorageService = new CloudStorageService();