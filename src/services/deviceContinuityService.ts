/**
 * Multi-Device Continuity Service
 *
 * Provides seamless experience continuation across desktop, tablet, and mobile devices
 * with real-time session synchronization and device-specific optimization
 */

import { RootState } from '../types';
import { syncService, SyncEvent } from './syncService';
import { cloudStorageService } from './cloudStorageService';

export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  deviceName: string;
  lastActivity: number;
  currentPage: string;
  currentFormationId?: string;
  currentPlayerId?: string;
  activeFeatures: string[];
  isActive: boolean;
}

export interface ContinuityData {
  sessionId: string;
  timestamp: number;
  page: string;
  scrollPosition: number;
  formState: Record<string, unknown>;
  selectedItems: string[];
  viewState: {
    zoom: number;
    pan: { x: number; y: number };
    activeFilters: Record<string, unknown>;
  };
}

export interface HandoffRequest {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  sessionData: ContinuityData;
  timestamp: number;
  isAccepted: boolean;
}

class DeviceContinuityService {
  private currentSession: DeviceSession | null = null;
  private activeSessions: Map<string, DeviceSession> = new Map();
  private continuityData: ContinuityData | null = null;
  private handoffRequests: Map<string, HandoffRequest> = new Map();

  // Event callbacks
  private onSessionUpdateCallback?: (sessions: DeviceSession[]) => void;
  private onHandoffRequestCallback?: (request: HandoffRequest) => void;
  private onContinuityDataCallback?: (data: ContinuityData) => void;

  constructor() {
    this.setupDeviceDetection();
    this.initializeSession();
  }

  /**
   * Initialize device continuity service
   */
  async initialize(userId: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Session not initialized');
    }

    this.currentSession.userId = userId;

    // Register with sync service
    syncService.onStateUpdate(this.handleRemoteStateUpdate.bind(this));
    syncService.onDeviceUpdate(this.handleDeviceUpdates.bind(this));

    // Start session heartbeat
    this.startSessionHeartbeat();

    // // // // console.log('📱 Multi-device continuity initialized');
  }

  /**
   * Update current session activity
   */
  async updateActivity(
    page: string,
    formationId?: string,
    playerId?: string,
    features: string[] = [],
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.lastActivity = Date.now();
    this.currentSession.currentPage = page;
    this.currentSession.currentFormationId = formationId;
    this.currentSession.currentPlayerId = playerId;
    this.currentSession.activeFeatures = features;

    // Broadcast session update
    await this.broadcastSessionUpdate();

    // Update continuity data
    this.updateContinuityData({
      sessionId: this.currentSession.id,
      timestamp: Date.now(),
      page,
      scrollPosition: window.scrollY || 0,
      formState: this.captureFormState(),
      selectedItems: [formationId, playerId].filter(Boolean) as string[],
      viewState: this.captureViewState(),
    });
  }

  /**
   * Capture current application state for continuity
   */
  captureApplicationState(): ContinuityData {
    return {
      sessionId: this.currentSession?.id || '',
      timestamp: Date.now(),
      page: window.location.pathname,
      scrollPosition: window.scrollY || 0,
      formState: this.captureFormState(),
      selectedItems: this.captureSelectedItems(),
      viewState: this.captureViewState(),
    };
  }

  /**
   * Restore application state from another device
   */
  async restoreApplicationState(continuityData: ContinuityData): Promise<void> {
    try {
      // Navigate to the same page
      if (continuityData.page !== window.location.pathname) {
        window.history.pushState({}, '', continuityData.page);
      }

      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, continuityData.scrollPosition);
      }, 100);

      // Restore form state
      this.restoreFormState(continuityData.formState);

      // Restore view state
      this.restoreViewState(continuityData.viewState);

      // Notify application of continuity data
      if (this.onContinuityDataCallback) {
        this.onContinuityDataCallback(continuityData);
      }

      // // // // console.log('🔄 Application state restored from another device');
    } catch (_error) {
      console.error('❌ Failed to restore application state:', _error);
    }
  }

  /**
   * Request handoff to another device
   */
  async requestHandoff(targetDeviceId: string): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const handoffRequest: HandoffRequest = {
      id: `handoff_${Date.now()}`,
      fromDeviceId: this.currentSession.deviceId,
      toDeviceId: targetDeviceId,
      sessionData: this.captureApplicationState(),
      timestamp: Date.now(),
      isAccepted: false,
    };

    this.handoffRequests.set(handoffRequest.id, handoffRequest);

    // Send handoff request through sync service
    await syncService.syncState(
      { type: 'HANDOFF_REQUEST', payload: handoffRequest } as any,
      {} as RootState,
    );

    // // // // console.log(`📲 Handoff requested to device: ${targetDeviceId}`);
  }

  /**
   * Accept handoff request from another device
   */
  async acceptHandoff(requestId: string): Promise<void> {
    const request = this.handoffRequests.get(requestId);
    if (!request) {
      return;
    }

    request.isAccepted = true;

    // Restore session data
    await this.restoreApplicationState(request.sessionData);

    // Notify other device of acceptance
    await syncService.syncState(
      { type: 'HANDOFF_ACCEPTED', payload: { requestId } } as any,
      {} as RootState,
    );

    // Clean up
    this.handoffRequests.delete(requestId);

    // // // // console.log('✅ Handoff accepted and session restored');
  }

  /**
   * Get active sessions across all devices
   */
  getActiveSessions(): DeviceSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.isActive)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Get current session info
   */
  getCurrentSession(): DeviceSession | null {
    return this.currentSession;
  }

  /**
   * Get pending handoff requests
   */
  getPendingHandoffRequests(): HandoffRequest[] {
    return Array.from(this.handoffRequests.values()).filter(request => !request.isAccepted);
  }

  /**
   * Optimize state for current device type
   */
  optimizeStateForDevice(state: RootState): RootState {
    if (!this.currentSession) {
      return state;
    }

    const optimizedState = { ...state };

    switch (this.currentSession.deviceType) {
      case 'mobile':
        // Mobile optimizations
        optimizedState.ui = {
          ...optimizedState.ui,
          isGridVisible: false,
          drawingTool: 'select',
          // Hide complex UI elements on mobile
          isFormationStrengthVisible: false,
        };
        break;

      case 'tablet':
        // Tablet optimizations
        optimizedState.ui = {
          ...optimizedState.ui,
          positioningMode: 'snap',
          // Optimize touch interactions
        };
        break;

      case 'desktop':
        // Desktop optimizations (full features)
        break;
    }

    return optimizedState;
  }

  // Event listener setters
  onSessionUpdate(callback: (sessions: DeviceSession[]) => void): void {
    this.onSessionUpdateCallback = callback;
  }

  onHandoffRequest(callback: (request: HandoffRequest) => void): void {
    this.onHandoffRequestCallback = callback;
  }

  onContinuityData(callback: (data: ContinuityData) => void): void {
    this.onContinuityDataCallback = callback;
  }

  // Private methods

  private initializeSession(): void {
    const deviceInfo = this.getDeviceInfo();

    this.currentSession = {
      id: `session_${Date.now()}_${deviceInfo.id}`,
      userId: '',
      deviceId: deviceInfo.id,
      deviceType: deviceInfo.type,
      deviceName: deviceInfo.name,
      lastActivity: Date.now(),
      currentPage: window.location.pathname,
      activeFeatures: [],
      isActive: true,
    };

    this.activeSessions.set(this.currentSession.deviceId, this.currentSession);
  }

  private async broadcastSessionUpdate(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      await syncService.syncState(
        { type: 'SESSION_UPDATE', payload: this.currentSession } as any,
        {} as RootState,
      );
    } catch (_error) {
      console.error('❌ Failed to broadcast session update:', _error);
    }
  }

  private updateContinuityData(data: ContinuityData): void {
    this.continuityData = data;

    // Store locally for offline continuity
    localStorage.setItem('astral_turf_continuity', JSON.stringify(data));
  }

  private captureFormState(): Record<string, unknown> {
    const formState: Record<string, unknown> = {};

    // Capture form inputs
    document.querySelectorAll('input, select, textarea').forEach((element, index) => {
      const input = element as HTMLInputElement;
      if (input.id || input.name) {
        const key = input.id || input.name || `element_${index}`;
        formState[key] = input.value;
      }
    });

    return formState;
  }

  private captureSelectedItems(): string[] {
    const selected: string[] = [];

    // Capture selected players, formations, etc.
    document.querySelectorAll('[data-selected="true"]').forEach(element => {
      const id = element.getAttribute('data-id');
      if (id) {
        selected.push(id);
      }
    });

    return selected;
  }

  private captureViewState() {
    return {
      zoom: 1, // Would capture actual zoom level from UI
      pan: { x: 0, y: 0 }, // Would capture actual pan position
      activeFilters: {}, // Would capture active filters
    };
  }

  private restoreFormState(formState: Record<string, unknown>): void {
    Object.entries(formState).forEach(([key, value]) => {
      const element =
        document.getElementById(key) ||
        (document.querySelector(`[name="${key}"]`) as HTMLInputElement);

      if (element && 'value' in element) {
        element.value = value;
      }
    });
  }

  private restoreViewState(viewState: ContinuityData['viewState']): void {
    // Would restore zoom, pan, filters, etc.
    // Implementation depends on specific UI framework
    // // // // console.log('🔧 View state restoration:', viewState);
  }

  private handleRemoteStateUpdate(action: any): void {
    if (action.type === 'SESSION_UPDATE') {
      const session = action.payload as DeviceSession;
      this.activeSessions.set(session.deviceId, session);

      if (this.onSessionUpdateCallback) {
        this.onSessionUpdateCallback(this.getActiveSessions());
      }
    }

    if (action.type === 'HANDOFF_REQUEST') {
      const request = action.payload as HandoffRequest;
      if (request.toDeviceId === this.currentSession?.deviceId) {
        this.handoffRequests.set(request.id, request);

        if (this.onHandoffRequestCallback) {
          this.onHandoffRequestCallback(request);
        }
      }
    }
  }

  private handleDeviceUpdates(devices: unknown[]): void {
    // Update active sessions based on device connectivity
    devices.forEach(device => {
      const dev = device as any;
      if (this.activeSessions.has(dev.id)) {
        const session = this.activeSessions.get(dev.id)!;
        session.isActive = dev.isOnline;
        session.lastActivity = dev.lastSeen;
      }
    });

    if (this.onSessionUpdateCallback) {
      this.onSessionUpdateCallback(this.getActiveSessions());
    }
  }

  private startSessionHeartbeat(): void {
    setInterval(async () => {
      if (this.currentSession) {
        this.currentSession.lastActivity = Date.now();
        await this.broadcastSessionUpdate();
      }
    }, 30000); // Every 30 seconds
  }

  private setupDeviceDetection(): void {
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.currentSession) {
        this.currentSession.isActive = !document.hidden;
        if (!document.hidden) {
          this.currentSession.lastActivity = Date.now();
        }
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentSession) {
        this.currentSession.isActive = false;
        // Quick sync before unload
        navigator.sendBeacon(
          '/api/session/close',
          JSON.stringify({
            sessionId: this.currentSession.id,
            timestamp: Date.now(),
          }),
        );
      }
    });
  }

  private getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const deviceId =
      localStorage.getItem('astral_turf_device_id') ||
      `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
    let deviceName = 'Unknown Device';

    // Device detection logic
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
      deviceName = 'Tablet';
    } else if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent,
      )
    ) {
      deviceType = 'mobile';
      deviceName = 'Mobile Device';
    } else {
      deviceName = 'Desktop';
    }

    // Store device ID
    if (!localStorage.getItem('astral_turf_device_id')) {
      localStorage.setItem('astral_turf_device_id', deviceId);
    }

    return { id: deviceId, type: deviceType, name: deviceName };
  }
}

// Singleton instance
export const deviceContinuityService = new DeviceContinuityService();
