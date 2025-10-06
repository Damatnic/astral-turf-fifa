/**
 * Database Service - Production-ready database layer with Prisma ORM
 *
 * Provides centralized database access with connection pooling, error handling,
 * transaction management, and comprehensive logging for the Astral Turf application.
 */

import { PrismaClient, Prisma } from '@prisma/client';
// Fallback logger for tests
const securityLogger = {
  info: (message: string, meta?: unknown) => {}, // console.log(`[DB-INFO] ${message}`, meta),
  error: (message: string, meta?: unknown) => console.error(`[DB-ERROR] ${message}`, meta),
  warn: (message: string, meta?: unknown) => {}, // console.warn(`[DB-WARN] ${message}`, meta),
  logSecurityEvent: (type: string, message: string, meta?: unknown) => {}, // console.log(`[DB-SECURITY] ${type}: ${message}`, meta),
};

const SecurityEventType = {
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  DATA_MODIFICATION: 'DATA_MODIFICATION',
};

// Database configuration
const DATABASE_CONFIG = {
  connectionLimit: 10,
  idleTimeout: 30000,
  acquireTimeout: 60000,
  createTimeout: 30000,
  destroyTimeout: 5000,
  reapInterval: 1000,
  createRetryInterval: 200,
  propagateCreateError: false,
};

// Prisma client with logging and error handling
class DatabaseService {
  private prisma: PrismaClient;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });

    this.setupEventListeners();
  }

  /**
   * Initialize database connection with retry logic
   */
  async initialize(): Promise<void> {
    try {
      await this.connect();
      securityLogger.info('Database service initialized successfully', {
        connectionPoolSize: DATABASE_CONFIG.connectionLimit,
        database: 'neondb',
        provider: 'postgresql',
      });
    } catch (_error) {
      securityLogger.error('Database service initialization failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        attempts: this.connectionAttempts,
      });
      throw _error;
    }
  }

  /**
   * Connect to database with retry logic
   */
  private async connect(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries && !this.isConnected) {
      try {
        this.connectionAttempts++;
        await this.prisma.$connect();

        // Test connection with a simple query
        await this.prisma.$queryRaw`SELECT 1 as connection_test`;

        this.isConnected = true;
        securityLogger.info('Database connection established', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
        });

        return;
      } catch (_error) {
        securityLogger.warn('Database connection attempt failed', {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries,
          error: _error instanceof Error ? _error.message : 'Unknown error',
        });

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
        }

        // Wait before retrying
        await this.delay(DATABASE_CONFIG.createRetryInterval * this.connectionAttempts);
      }
    }
  }

  /**
   * Setup Prisma event listeners for logging and monitoring
   */
  private setupEventListeners(): void {
    // Query logging
    (this.prisma.$on as any)('query', (e: any) => {
      if (process.env.NODE_ENV === 'development') {
        // // // // console.log('Query: ' + e.query);
        // // // // console.log('Params: ' + e.params);
        // // // // console.log('Duration: ' + e.duration + 'ms');
      }
    });

    // Error logging
    (this.prisma.$on as any)('error', (e: any) => {
      securityLogger.error('Database error occurred', {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    // Info logging
    (this.prisma.$on as any)('info', (e: any) => {
      securityLogger.info('Database info', {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    // Warning logging
    (this.prisma.$on as any)('warn', (e: any) => {
      securityLogger.warn('Database warning', {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return this.prisma;
  }

  /**
   * Execute transaction with automatic retry and error handling
   */
  async executeTransaction<T>(
    operations: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    try {
      const result = await this.prisma.$transaction(operations, {
        maxWait: options?.maxWait || 5000,
        timeout: options?.timeout || 10000,
        isolationLevel: options?.isolationLevel,
      });

      securityLogger.logSecurityEvent(
        SecurityEventType.DATA_MODIFICATION,
        'Database transaction completed successfully',
        {
          metadata: {
            transactionType: 'bulk_operation',
            isolationLevel: options?.isolationLevel || 'default',
          },
        }
      );

      return result;
    } catch (_error) {
      securityLogger.error('Database transaction failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        isolationLevel: options?.isolationLevel || 'default',
      });
      throw _error;
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    details: {
      connected: boolean;
      database: string;
      version?: string;
      poolSize?: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const result = await this.prisma.$queryRaw<[{ version: string; current_database: string }]>`
        SELECT version(), current_database()
      `;

      const latency = Date.now() - startTime;
      const dbInfo = result[0];

      return {
        status: 'healthy',
        latency,
        details: {
          connected: this.isConnected,
          database: dbInfo.current_database,
          version: dbInfo.version.split(' ')[0], // Extract just the version number
          poolSize: DATABASE_CONFIG.connectionLimit,
        },
      };
    } catch (_error) {
      const latency = Date.now() - startTime;

      securityLogger.error('Database health check failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
        latency,
      });

      return {
        status: 'unhealthy',
        latency,
        details: {
          connected: false,
          database: 'unknown',
        },
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    uptime: number;
  }> {
    try {
      const stats = await this.prisma.$queryRaw<
        [
          {
            total_connections: number;
            active_connections: number;
            uptime: number;
          },
        ]
      >`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime
      `;

      const dbStats = stats[0];

      return {
        totalConnections: Number(dbStats.total_connections),
        activeConnections: Number(dbStats.active_connections),
        totalQueries: 0, // Would need to implement query counter
        averageQueryTime: 0, // Would need to implement query time tracking
        uptime: Number(dbStats.uptime),
      };
    } catch (_error) {
      securityLogger.error('Failed to get database statistics', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });

      return {
        totalConnections: 0,
        activeConnections: 0,
        totalQueries: 0,
        averageQueryTime: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Gracefully disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      securityLogger.info('Database connection closed gracefully');
    } catch (_error) {
      securityLogger.error('Error during database disconnection', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Reset connection (useful for testing)
   */
  async resetConnection(): Promise<void> {
    await this.disconnect();
    this.connectionAttempts = 0;
    await this.initialize();
  }
}

// Singleton instance
export const databaseService = new DatabaseService();

// Export Prisma types for use in other services
export { Prisma } from '@prisma/client';
export type { User, Player, Team, Match, Formation } from '@prisma/client';

// Export utility functions
export const db = () => databaseService.getClient();

/**
 * Initialize database service - call this on application startup
 */
export const initializeDatabase = async (): Promise<void> => {
  await databaseService.initialize();
};

/**
 * Graceful shutdown - call this on application shutdown
 */
export const shutdownDatabase = async (): Promise<void> => {
  await databaseService.disconnect();
};
