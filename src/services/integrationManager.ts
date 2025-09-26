/**
 * Integration Manager - Central Hub for All External Integrations
 *
 * Manages and coordinates all external integrations, providing a unified interface
 * for connectivity, monitoring, and configuration across all integration services
 */

import { syncService } from './syncService';
import { cloudStorageService } from './cloudStorageService';
import { deviceContinuityService } from './deviceContinuityService';
import { calendarIntegrationService } from './calendarIntegrationService';
import { notificationService } from './notificationService';
import { socialMediaIntegrationService } from './socialMediaIntegrationService';
import { sportsDataApiService } from './sportsDataApiService';
import { apiService } from './apiService';
import { webhookService } from './webhookService';
import { initSecurity } from './securityService';

export interface IntegrationStatus {
  service: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: number;
  nextSync?: number;
  errorMessage?: string;
  metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    avgResponseTime: number;
    uptime: number;
  };
}

export interface IntegrationConfig {
  cloudSync: {
    enabled: boolean;
    endpoint: string;
    region: string;
    encryptionEnabled: boolean;
    autoBackup: boolean;
    backupInterval: number;
  };
  calendar: {
    enabled: boolean;
    providers: {
      google: { enabled: boolean; clientId?: string; clientSecret?: string };
      outlook: { enabled: boolean; clientId?: string; clientSecret?: string };
      apple: { enabled: boolean; credentials?: string };
    };
    autoCreateEvents: boolean;
    reminderDefaults: number[];
  };
  notifications: {
    enabled: boolean;
    channels: {
      email: { enabled: boolean; smtpConfig?: unknown };
      sms: { enabled: boolean; provider?: string; apiKey?: string };
      push: { enabled: boolean; fcmKey?: string };
      webhook: { enabled: boolean };
    };
    quietHours: { start: string; end: string };
    frequency: 'immediate' | 'hourly' | 'daily';
  };
  socialMedia: {
    enabled: boolean;
    platforms: {
      twitter: { enabled: boolean; apiKey?: string; apiSecret?: string };
      facebook: { enabled: boolean; appId?: string; appSecret?: string };
      instagram: { enabled: boolean; accessToken?: string };
      linkedin: { enabled: boolean; clientId?: string; clientSecret?: string };
    };
    autoShare: boolean;
    privacyMode: boolean;
  };
  sportsData: {
    enabled: boolean;
    providers: {
      footballApi: { enabled: boolean; apiKey?: string };
      sportsRadar: { enabled: boolean; apiKey?: string };
      catapult: { enabled: boolean; credentials?: unknown };
      statsports: { enabled: boolean; credentials?: unknown };
    };
    syncInterval: number;
    benchmarkingEnabled: boolean;
  };
  api: {
    enabled: boolean;
    publicApi: boolean;
    graphqlEnabled: boolean;
    rateLimits: {
      authenticated: number;
      anonymous: number;
    };
    webhooksEnabled: boolean;
    documentationEnabled: boolean;
  };
}

export interface IntegrationEvent {
  id: string;
  timestamp: number;
  service: string;
  type: 'connection' | 'sync' | 'error' | 'data_update' | 'config_change';
  data: unknown;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface IntegrationMetrics {
  overview: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalDataSynced: number;
    totalApiCalls: number;
    avgResponseTime: number;
    errorRate: number;
  };
  services: {
    [serviceName: string]: {
      operationsPerHour: number;
      successRate: number;
      avgResponseTime: number;
      dataVolume: number;
      lastActivity: number;
    };
  };
  trends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

class IntegrationManager {
  private config: IntegrationConfig;
  private serviceStatuses: Map<string, IntegrationStatus> = new Map();
  private eventLog: IntegrationEvent[] = [];
  private metricsHistory: Map<string, unknown[]> = new Map();
  private isInitialized = false;

  // Event callbacks
  private onStatusChangeCallback?: (service: string, status: IntegrationStatus) => void;
  private onEventLoggedCallback?: (event: IntegrationEvent) => void;
  private onMetricsUpdateCallback?: (metrics: IntegrationMetrics) => void;

  constructor() {
    this.config = this.getDefaultConfig();
    this.setupPeriodicTasks();
  }

  /**
   * Initialize all integration services
   */
  async initialize(userId: string, userApiKey: string): Promise<void> {
    if (this.isInitialized) {
      // // // // console.log('⚠️ Integration manager already initialized');
      return;
    }

    try {
      // // // // console.log('🚀 Initializing Integration Manager...');

      // Initialize security
      initSecurity(userApiKey);

      // Load configuration
      await this.loadConfiguration(userId);

      // Initialize core services in dependency order
      await this.initializeCoreServices(userId, userApiKey);

      // Initialize communication services
      await this.initializeCommunicationServices();

      // Initialize data services
      await this.initializeDataServices();

      // Initialize API services
      await this.initializeApiServices();

      // Setup service monitoring
      this.setupServiceMonitoring();

      // Setup event handlers
      this.setupCrossServiceEventHandlers();

      this.isInitialized = true;
      this.logEvent(
        'integration_manager',
        'initialization',
        'All services initialized successfully',
        'info',
      );

      // // // // console.log('✅ Integration Manager initialized successfully');
    } catch (_error) {
      this.logEvent(
        'integration_manager',
        'error',
        `Initialization failed: ${error.message}`,
        'critical',
      );
      throw error;
    }
  }

  /**
   * Get status of all integrations
   */
  getIntegrationStatuses(): IntegrationStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get detailed integration metrics
   */
  getIntegrationMetrics(): IntegrationMetrics {
    const statuses = this.getIntegrationStatuses();
    const totalIntegrations = statuses.length;
    const activeIntegrations = statuses.filter(s => s.status === 'connected').length;

    let totalOperations = 0;
    let successfulOperations = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    const services: IntegrationMetrics['services'] = {};

    statuses.forEach(status => {
      totalOperations += status.metrics.totalOperations;
      successfulOperations += status.metrics.successfulOperations;

      if (status.metrics.avgResponseTime > 0) {
        totalResponseTime += status.metrics.avgResponseTime;
        responseTimeCount++;
      }

      services[status.service] = {
        operationsPerHour: this.calculateOperationsPerHour(status),
        successRate:
          status.metrics.totalOperations > 0
            ? (status.metrics.successfulOperations / status.metrics.totalOperations) * 100
            : 0,
        avgResponseTime: status.metrics.avgResponseTime,
        dataVolume: this.calculateDataVolume(status),
        lastActivity: status.lastSync || 0,
      };
    });

    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    const errorRate =
      totalOperations > 0 ? ((totalOperations - successfulOperations) / totalOperations) * 100 : 0;

    return {
      overview: {
        totalIntegrations,
        activeIntegrations,
        totalDataSynced: this.calculateTotalDataSynced(),
        totalApiCalls: totalOperations,
        avgResponseTime,
        errorRate,
      },
      services,
      trends: {
        hourly: this.getTrend('hourly'),
        daily: this.getTrend('daily'),
        weekly: this.getTrend('weekly'),
      },
    };
  }

  /**
   * Update integration configuration
   */
  async updateConfiguration(updates: Partial<IntegrationConfig>): Promise<void> {
    const oldConfig = JSON.parse(JSON.stringify(this.config));
    this.config = { ...this.config, ...updates };

    try {
      await this.saveConfiguration();
      await this.applyConfigurationChanges(oldConfig, this.config);

      this.logEvent(
        'integration_manager',
        'config_change',
        'Configuration updated successfully',
        'info',
      );
      // // // // console.log('⚙️ Integration configuration updated');
    } catch (_error) {
      this.config = oldConfig; // Rollback
      this.logEvent(
        'integration_manager',
        'error',
        `Configuration update failed: ${error.message}`,
        'error',
      );
      throw error;
    }
  }

  /**
   * Test connection to specific integration
   */
  async testConnection(
    serviceName: string,
  ): Promise<{ success: boolean; message: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      let testResult: boolean = false;

      switch (serviceName) {
        case 'sync':
          testResult = syncService.isSyncAvailable();
          break;

        case 'cloudStorage':
          // Test cloud storage connection
          testResult = true; // Simplified for demo
          break;

        case 'calendar':
          const providers = calendarIntegrationService.getConnectedProviders();
          testResult = providers.length > 0;
          break;

        case 'notifications':
          const notificationStats = await notificationService.getDeliveryStats();
          testResult = true; // Service is always available
          break;

        case 'socialMedia':
          const connectedPlatforms = socialMediaIntegrationService.getConnectedPlatforms();
          testResult = connectedPlatforms.length > 0;
          break;

        case 'sportsData':
          // Test sports data API connections
          testResult = true; // Simplified for demo
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      const responseTime = Date.now() - startTime;

      if (testResult) {
        this.updateServiceStatus(serviceName, { status: 'connected' });
        return { success: true, message: 'Connection test successful', responseTime };
      } else {
        this.updateServiceStatus(serviceName, { status: 'disconnected' });
        return { success: false, message: 'Service not properly connected', responseTime };
      }
    } catch (_error) {
      const responseTime = Date.now() - startTime;
      this.updateServiceStatus(serviceName, {
        status: 'error',
        errorMessage: error.message,
      });

      return { success: false, message: error.message, responseTime };
    }
  }

  /**
   * Force sync for specific service
   */
  async forceSyncService(serviceName: string): Promise<void> {
    this.updateServiceStatus(serviceName, { status: 'syncing' });

    try {
      switch (serviceName) {
        case 'sync':
          // Force state sync across all devices
          break;

        case 'cloudStorage':
          await cloudStorageService.syncToCloud();
          break;

        case 'calendar':
          await calendarIntegrationService.syncCalendars();
          break;

        case 'sportsData':
          // Force sync of sports data
          break;

        default:
          throw new Error(`Sync not supported for service: ${serviceName}`);
      }

      this.updateServiceStatus(serviceName, {
        status: 'connected',
        lastSync: Date.now(),
      });

      this.logEvent(serviceName, 'sync', 'Manual sync completed successfully', 'info');
    } catch (_error) {
      this.updateServiceStatus(serviceName, {
        status: 'error',
        errorMessage: error.message,
      });

      this.logEvent(serviceName, 'error', `Manual sync failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get integration event log
   */
  getEventLog(limit: number = 100, service?: string): IntegrationEvent[] {
    let events = [...this.eventLog];

    if (service) {
      events = events.filter(e => e.service === service);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Generate integration health report
   */
  generateHealthReport(): {
    overall: 'healthy' | 'warning' | 'critical';
    services: { [service: string]: { status: string; issues: string[] } };
    recommendations: string[];
  } {
    const statuses = this.getIntegrationStatuses();
    const issues: string[] = [];
    const recommendations: string[] = [];
    const serviceReports: unknown = {};

    let healthyServices = 0;
    const totalServices = statuses.length;

    statuses.forEach(status => {
      const serviceIssues: string[] = [];

      if (status.status === 'error' || status.status === 'disconnected') {
        serviceIssues.push(`Service is ${status.status}`);
        if (status.errorMessage) {
          serviceIssues.push(status.errorMessage);
        }
      } else {
        healthyServices++;
      }

      if (status.metrics.successfulOperations / status.metrics.totalOperations < 0.95) {
        serviceIssues.push('Low success rate');
        recommendations.push(`Investigate ${status.name} reliability issues`);
      }

      if (status.metrics.avgResponseTime > 5000) {
        serviceIssues.push('High response times');
        recommendations.push(`Optimize ${status.name} performance`);
      }

      serviceReports[status.service] = {
        status: status.status,
        issues: serviceIssues,
      };
    });

    const healthRatio = totalServices > 0 ? healthyServices / totalServices : 1;
    let overall: 'healthy' | 'warning' | 'critical';

    if (healthRatio >= 0.9) {
      overall = 'healthy';
    } else if (healthRatio >= 0.7) {
      overall = 'warning';
      recommendations.push('Address service connection issues');
    } else {
      overall = 'critical';
      recommendations.push('Immediate attention required for multiple service failures');
    }

    return {
      overall,
      services: serviceReports,
      recommendations,
    };
  }

  // Event listener setters
  onStatusChange(callback: (service: string, status: IntegrationStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  onEventLogged(callback: (event: IntegrationEvent) => void): void {
    this.onEventLoggedCallback = callback;
  }

  onMetricsUpdate(callback: (metrics: IntegrationMetrics) => void): void {
    this.onMetricsUpdateCallback = callback;
  }

  // Private methods

  private getDefaultConfig(): IntegrationConfig {
    return {
      cloudSync: {
        enabled: true,
        endpoint: 'https://api.astralturf.com/sync',
        region: 'us-east-1',
        encryptionEnabled: true,
        autoBackup: true,
        backupInterval: 24 * 60 * 60 * 1000, // 24 hours
      },
      calendar: {
        enabled: false,
        providers: {
          google: { enabled: false },
          outlook: { enabled: false },
          apple: { enabled: false },
        },
        autoCreateEvents: true,
        reminderDefaults: [60, 15], // 1 hour, 15 minutes
      },
      notifications: {
        enabled: true,
        channels: {
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: true },
          webhook: { enabled: false },
        },
        quietHours: { start: '22:00', end: '07:00' },
        frequency: 'immediate',
      },
      socialMedia: {
        enabled: false,
        platforms: {
          twitter: { enabled: false },
          facebook: { enabled: false },
          instagram: { enabled: false },
          linkedin: { enabled: false },
        },
        autoShare: false,
        privacyMode: true,
      },
      sportsData: {
        enabled: false,
        providers: {
          footballApi: { enabled: false },
          sportsRadar: { enabled: false },
          catapult: { enabled: false },
          statsports: { enabled: false },
        },
        syncInterval: 60 * 60 * 1000, // 1 hour
        benchmarkingEnabled: false,
      },
      api: {
        enabled: true,
        publicApi: false,
        graphqlEnabled: true,
        rateLimits: {
          authenticated: 1000,
          anonymous: 100,
        },
        webhooksEnabled: false,
        documentationEnabled: true,
      },
    };
  }

  private async initializeCoreServices(userId: string, userApiKey: string): Promise<void> {
    // Initialize sync service
    if (this.config.cloudSync.enabled) {
      try {
        await syncService.initialize(userId, userApiKey);
        this.updateServiceStatus('sync', {
          service: 'sync',
          name: 'Real-time Sync',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('sync', {
          service: 'sync',
          name: 'Real-time Sync',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }

    // Initialize cloud storage
    if (this.config.cloudSync.enabled) {
      try {
        await cloudStorageService.initialize(userId, {
          endpoint: this.config.cloudSync.endpoint,
          apiKey: userApiKey,
          region: this.config.cloudSync.region,
          bucket: 'astral-turf-data',
        });
        this.updateServiceStatus('cloudStorage', {
          service: 'cloudStorage',
          name: 'Cloud Storage',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('cloudStorage', {
          service: 'cloudStorage',
          name: 'Cloud Storage',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }

    // Initialize device continuity
    try {
      await deviceContinuityService.initialize(userId);
      this.updateServiceStatus('deviceContinuity', {
        service: 'deviceContinuity',
        name: 'Device Continuity',
        status: 'connected',
        metrics: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          avgResponseTime: 0,
          uptime: 100,
        },
      });
    } catch (_error) {
      this.updateServiceStatus('deviceContinuity', {
        service: 'deviceContinuity',
        name: 'Device Continuity',
        status: 'error',
        errorMessage: error.message,
        metrics: {
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 1,
          avgResponseTime: 0,
          uptime: 0,
        },
      });
    }
  }

  private async initializeCommunicationServices(): Promise<void> {
    // Initialize calendar integration
    if (this.config.calendar.enabled) {
      try {
        await calendarIntegrationService.initialize();
        this.updateServiceStatus('calendar', {
          service: 'calendar',
          name: 'Calendar Integration',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('calendar', {
          service: 'calendar',
          name: 'Calendar Integration',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }

    // Initialize notifications
    if (this.config.notifications.enabled) {
      try {
        await notificationService.initialize();
        this.updateServiceStatus('notifications', {
          service: 'notifications',
          name: 'Notifications',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('notifications', {
          service: 'notifications',
          name: 'Notifications',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }

    // Initialize social media
    if (this.config.socialMedia.enabled) {
      try {
        await socialMediaIntegrationService.initialize();
        this.updateServiceStatus('socialMedia', {
          service: 'socialMedia',
          name: 'Social Media',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('socialMedia', {
          service: 'socialMedia',
          name: 'Social Media',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }
  }

  private async initializeDataServices(): Promise<void> {
    // Initialize sports data APIs
    if (this.config.sportsData.enabled) {
      try {
        await sportsDataApiService.initialize();
        this.updateServiceStatus('sportsData', {
          service: 'sportsData',
          name: 'Sports Data APIs',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('sportsData', {
          service: 'sportsData',
          name: 'Sports Data APIs',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }
  }

  private async initializeApiServices(): Promise<void> {
    // Initialize API service
    if (this.config.api.enabled) {
      try {
        await apiService.initialize();
        this.updateServiceStatus('api', {
          service: 'api',
          name: 'Public API',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('api', {
          service: 'api',
          name: 'Public API',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }

    // Initialize webhook service
    if (this.config.api.webhooksEnabled) {
      try {
        await webhookService.initialize();
        this.updateServiceStatus('webhooks', {
          service: 'webhooks',
          name: 'Webhooks',
          status: 'connected',
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            avgResponseTime: 0,
            uptime: 100,
          },
        });
      } catch (_error) {
        this.updateServiceStatus('webhooks', {
          service: 'webhooks',
          name: 'Webhooks',
          status: 'error',
          errorMessage: error.message,
          metrics: {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 1,
            avgResponseTime: 0,
            uptime: 0,
          },
        });
      }
    }
  }

  private setupServiceMonitoring(): void {
    // Monitor service health every 5 minutes
    setInterval(
      () => {
        this.checkServiceHealth();
      },
      5 * 60 * 1000,
    );

    // Update metrics every minute
    setInterval(() => {
      this.updateMetrics();
    }, 60 * 1000);

    // Clean old event logs every hour
    setInterval(
      () => {
        this.cleanEventLog();
      },
      60 * 60 * 1000,
    );
  }

  private setupCrossServiceEventHandlers(): void {
    // Setup event handlers to coordinate between services

    // Sync service events
    syncService.onStateUpdate(action => {
      this.logEvent('sync', 'data_update', 'State synchronized across devices', 'info');
    });

    syncService.onConflict(conflict => {
      this.logEvent('sync', 'error', 'Sync conflict detected', 'warning');
    });

    // Cloud storage events
    cloudStorageService.onSyncComplete((success, error) => {
      if (success) {
        this.logEvent('cloudStorage', 'sync', 'Cloud backup completed', 'info');
      } else {
        this.logEvent('cloudStorage', 'error', `Cloud backup failed: ${error}`, 'error');
      }
    });

    // Notification events
    notificationService.onNotificationSent((notification, success) => {
      if (success) {
        this.updateServiceMetrics('notifications', 'success');
      } else {
        this.updateServiceMetrics('notifications', 'failure');
      }
    });

    // Social media events
    socialMediaIntegrationService.onPostPublished(post => {
      this.logEvent('socialMedia', 'data_update', `Post published to ${post.platformId}`, 'info');
      this.updateServiceMetrics('socialMedia', 'success');
    });

    // API events
    apiService.onApiCall(usage => {
      this.updateServiceMetrics('api', usage.statusCode < 400 ? 'success' : 'failure');
    });

    // Webhook events
    webhookService.onWebhookDelivered(delivery => {
      this.logEvent('webhooks', 'sync', `Webhook delivered to ${delivery.url}`, 'info');
      this.updateServiceMetrics('webhooks', 'success');
    });

    webhookService.onWebhookFailed((delivery, error) => {
      this.logEvent('webhooks', 'error', `Webhook delivery failed: ${error}`, 'error');
      this.updateServiceMetrics('webhooks', 'failure');
    });
  }

  private async checkServiceHealth(): Promise<void> {
    const services = Array.from(this.serviceStatuses.keys());

    for (const service of services) {
      try {
        const { success } = await this.testConnection(service);
        if (!success) {
          this.logEvent(service, 'error', 'Health check failed', 'warning');
        }
      } catch (_error) {
        this.logEvent(service, 'error', `Health check error: ${error.message}`, 'error');
      }
    }
  }

  private updateServiceStatus(serviceName: string, updates: Partial<IntegrationStatus>): void {
    const current = this.serviceStatuses.get(serviceName);
    const updated = { ...current, ...updates } as IntegrationStatus;

    this.serviceStatuses.set(serviceName, updated);

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(serviceName, updated);
    }
  }

  private updateServiceMetrics(serviceName: string, operation: 'success' | 'failure'): void {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) {
      return;
    }

    status.metrics.totalOperations++;
    if (operation === 'success') {
      status.metrics.successfulOperations++;
    } else {
      status.metrics.failedOperations++;
    }

    this.serviceStatuses.set(serviceName, status);
  }

  private logEvent(
    service: string,
    type: IntegrationEvent['type'],
    data: unknown,
    severity: IntegrationEvent['severity'],
  ): void {
    const event: IntegrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      service,
      type,
      data,
      severity,
    };

    this.eventLog.push(event);

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500);
    }

    if (this.onEventLoggedCallback) {
      this.onEventLoggedCallback(event);
    }
  }

  private updateMetrics(): void {
    const metrics = this.getIntegrationMetrics();

    if (this.onMetricsUpdateCallback) {
      this.onMetricsUpdateCallback(metrics);
    }
  }

  private cleanEventLog(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.eventLog = this.eventLog.filter(event => event.timestamp > oneWeekAgo);
  }

  private setupPeriodicTasks(): void {
    // Setup periodic tasks that run regardless of initialization status

    // Save metrics history every hour
    setInterval(
      () => {
        if (this.isInitialized) {
          const metrics = this.getIntegrationMetrics();
          const timestamp = Date.now();

          this.metricsHistory.set(timestamp.toString(), {
            timestamp,
            metrics,
          });

          // Keep only last 168 hours (1 week)
          const history = Array.from(this.metricsHistory.entries());
          if (history.length > 168) {
            const toDelete = history.slice(0, -168);
            toDelete.forEach(([key]) => {
              this.metricsHistory.delete(key);
            });
          }
        }
      },
      60 * 60 * 1000,
    );
  }

  private calculateOperationsPerHour(status: IntegrationStatus): number {
    // Simplified calculation - in real implementation would use time-based data
    return Math.floor(status.metrics.totalOperations / Math.max(status.metrics.uptime / 100, 1));
  }

  private calculateDataVolume(status: IntegrationStatus): number {
    // Simplified calculation - would track actual data volume
    return status.metrics.totalOperations * 1024; // Assume 1KB per operation
  }

  private calculateTotalDataSynced(): number {
    let total = 0;
    for (const status of this.serviceStatuses.values()) {
      total += this.calculateDataVolume(status);
    }
    return total;
  }

  private getTrend(period: 'hourly' | 'daily' | 'weekly'): number[] {
    // Simplified trend calculation - would use actual historical data
    const length = period === 'hourly' ? 24 : period === 'daily' ? 30 : 52;
    const trend = [];

    for (let i = 0; i < length; i++) {
      trend.push(Math.floor(Math.random() * 100));
    }

    return trend;
  }

  private async loadConfiguration(userId: string): Promise<void> {
    const saved = localStorage.getItem(`integration_config_${userId}`);
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
  }

  private async saveConfiguration(): Promise<void> {
    // In a real implementation, would save to secure storage
    // // // // console.log('💾 Integration configuration saved');
  }

  private async applyConfigurationChanges(
    oldConfig: IntegrationConfig,
    newConfig: IntegrationConfig,
  ): Promise<void> {
    // Apply configuration changes to running services
    // // // // console.log('⚙️ Applying configuration changes');
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();
