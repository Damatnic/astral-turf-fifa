/**
 * Application Initialization Service
 *
 * Handles the startup sequence for the Astral Turf application,
 * ensuring all services are properly initialized and healthy.
 */

// Only import database services on server side
let databaseService: unknown = null;
let initializeDatabase: unknown = null;
let healthService: unknown = null;
let redisService: unknown = null;
let securityLogger: unknown = null;
let initializeSecurityMonitoring: unknown = null;
let initSecurityMonitoring: unknown = null;
let performanceService: unknown = null;
let backupService: unknown = null;

// Check if we're on the server side (Node.js environment)
const isServerSide = typeof window === 'undefined' && typeof process !== 'undefined';

if (isServerSide) {
  try {
    // const dbModule = await import('./databaseService');
    databaseService = dbModule.databaseService;
    initializeDatabase = dbModule.initializeDatabase;

    // const healthModule = await import('./healthService');
    healthService = healthModule.healthService;

    // const redisModule = await import('./redisService');
    redisService = redisModule.redisService;

    // const loggingModule = await import('../security/logging');
    securityLogger = loggingModule.securityLogger;
    initializeSecurityMonitoring = loggingModule.initializeSecurityMonitoring;

    // const monitoringModule = await import('../security/monitoring');
    initSecurityMonitoring = monitoringModule.initializeSecurityMonitoring;
  } catch (_error) {
    // // console.warn('Server-side modules not available in client environment');
  }
}

export interface InitializationResult {
  success: boolean;
  services: {
    [key: string]: {
      initialized: boolean;
      error?: string;
      duration: number;
    };
  };
  totalDuration: number;
}

class InitializationService {
  private initialized = false;
  private initializationResult: InitializationResult | null = null;

  /**
   * Initialize all application services in the correct order
   */
  async initialize(): Promise<InitializationResult> {
    const startTime = Date.now();
    const services: InitializationResult['services'] = {};

    // // console.log('🚀 Starting Astral Turf application initialization...');

    // Initialize performance service (works on both client and server)
    await this.initializeService('Performance', async () => {
      if (!performanceService) {
        const { performanceService: perfSvc } = await import('./performanceService');
        performanceService = perfSvc;
      }
      await performanceService.initialize();
    }, services);

    // Skip server-side initialization on client
    if (!isServerSide) {
      // // console.log('🌐 Client-side initialization - skipping server services');

      const totalDuration = Date.now() - startTime;
      this.initialized = true;
      this.initializationResult = {
        success: true,
        services,
        totalDuration,
      };

      // // console.log('✅ Client-side initialization completed');
      return this.initializationResult;
    }

    try {
      // Server-side initialization only
      // 1. Initialize Security Monitoring (first, so we can log everything)
      if (initializeSecurityMonitoring && initSecurityMonitoring) {
        await this.initializeService('security-monitoring', async () => {
          initializeSecurityMonitoring();
          initSecurityMonitoring();
        }, services);
      }

      // 2. Initialize Database
      if (initializeDatabase) {
        await this.initializeService('database', async () => {
          await initializeDatabase();
        }, services);
      }

      // 3. Initialize Redis (optional - graceful fallback if not available)
      if (redisService) {
        await this.initializeService('redis', async () => {
          try {
            await redisService.initialize();
          } catch (_error) {
            // // console.warn('⚠️ Redis not available - using in-memory fallback');
            // Don't throw error - Redis is optional
          }
        }, services);
      }

      // 4. Initialize Health Service
      if (healthService) {
        await this.initializeService('health-service', async () => {
          healthService.initialize();
        }, services);
      }

      // 5. Initialize Backup Service (server-side only)
      await this.initializeService('backup-service', async () => {
        if (!backupService) {
          const { backupService: bkSvc } = await import('./backupService');
          backupService = bkSvc;
        }
        await backupService.initialize();
      }, services);

      // 5. Validate all services are healthy
      await this.validateServices();

      const totalDuration = Date.now() - startTime;
      this.initialized = true;

      const result: InitializationResult = {
        success: true,
        services,
        totalDuration,
      };

      this.initializationResult = result;

      // // console.log(`✅ Astral Turf initialized successfully in ${totalDuration}ms`);
      securityLogger.info('Application initialization completed', {
        duration: totalDuration,
        services: Object.keys(services),
      });

      return result;

    } catch (_error) {
      const totalDuration = Date.now() - startTime;

      const result: InitializationResult = {
        success: false,
        services,
        totalDuration,
      };

      this.initializationResult = result;

      console.error('❌ Astral Turf initialization failed:', error);
      securityLogger.error('Application initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: totalDuration,
        services: Object.keys(services),
      });

      throw error;
    }
  }

  /**
   * Initialize a single service with error handling and timing
   */
  private async initializeService(
    name: string,
    initFunction: () => Promise<void> | void,
    services: InitializationResult['services'],
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // // console.log(`  📦 Initializing ${name}...`);
      await initFunction();

      const duration = Date.now() - startTime;
      services[name] = {
        initialized: true,
        duration,
      };

      // // console.log(`  ✅ ${name} initialized (${duration}ms)`);
    } catch (_error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      services[name] = {
        initialized: false,
        error: errorMessage,
        duration,
      };

      console.error(`  ❌ ${name} failed to initialize: ${errorMessage}`);
      throw new Error(`Failed to initialize ${name}: ${errorMessage}`);
    }
  }

  /**
   * Validate that all critical services are healthy
   */
  private async validateServices(): Promise<void> {
    // // console.log('  🔍 Validating service health...');

    // Skip validation on client side
    if (!isServerSide) {
      // // console.log('  🌐 Client-side - skipping server service validation');
      return;
    }

    try {
      // Check database health
      if (databaseService) {
        const dbHealth = await databaseService.healthCheck();
        if (dbHealth.status !== 'healthy') {
          throw new Error(`Database is not healthy: ${dbHealth.status}`);
        }
      }

      // Check overall application health
      if (healthService) {
        const appHealth = await healthService.getHealth();
        if (appHealth.status === 'unhealthy') {
          throw new Error('Application health check failed');
        }
      }

      // // console.log('  ✅ All services are healthy');
    } catch (_error) {
      console.error('  ❌ Service validation failed:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown of all services
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // // console.log('🛑 Shutting down Astral Turf application...');

    try {
      // Shutdown performance service (works on both client and server)
      if (performanceService) {
        // // console.log('  ⚡ Shutting down performance service...');
        await performanceService.destroy();
      }
    } catch (_error) {
      console.error('  ❌ Performance service shutdown error:', error);
    }

    // Skip server-side shutdown on client
    if (!isServerSide) {
      // // console.log('🌐 Client-side shutdown - no server services to stop');
      this.initialized = false;
      return;
    }

    try {
      // Server-side shutdown in reverse order
      if (backupService) {
        // // console.log('  🔄 Shutting down backup service...');
        await backupService.destroy();
      }

      if (healthService) {
        // // console.log('  📦 Shutting down health service...');
        healthService.shutdown();
      }

      if (redisService) {
        // // console.log('  📦 Shutting down Redis...');
        try {
          await redisService.disconnect();
        } catch (_error) {
          // // console.warn('⚠️ Redis disconnect failed (may not have been connected)');
        }
      }

      if (databaseService) {
        // // console.log('  📦 Shutting down database...');
        await databaseService.disconnect();
      }

      this.initialized = false;
      // // console.log('✅ Astral Turf shut down successfully');

      securityLogger.info('Application shutdown completed');
    } catch (_error) {
      console.error('❌ Error during shutdown:', error);
      securityLogger.error('Application shutdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get initialization result
   */
  getInitializationResult(): InitializationResult | null {
    return this.initializationResult;
  }

  /**
   * Health check for the initialization service itself
   */
  getStatus(): {
    initialized: boolean;
    uptime: number;
    services: string[];
  } {
    return {
      initialized: this.initialized,
      uptime: this.initializationResult?.totalDuration || 0,
      services: Object.keys(this.initializationResult?.services || {}),
    };
  }
}

// Singleton instance
export const initializationService = new InitializationService();

/**
 * Initialize the application - call this at startup
 */
export const initializeApplication = async (): Promise<InitializationResult> => {
  return await initializationService.initialize();
};

/**
 * Shutdown the application - call this during graceful shutdown
 */
export const shutdownApplication = async (): Promise<void> => {
  await initializationService.shutdown();
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = (): void => {
  const gracefulShutdown = async (signal: string) => {
    // // console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

    try {
      await shutdownApplication();
      process.exit(0);
    } catch (_error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    securityLogger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    securityLogger.error('Unhandled promise rejection', {
      reason: String(reason),
      promise: String(promise),
    });
    gracefulShutdown('unhandledRejection');
  });
};
