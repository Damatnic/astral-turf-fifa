/**
 * Health Check Service - Production-ready health monitoring
 *
 * Provides comprehensive health checks for all application components
 * including database, external services, and system resources.
 */

import { databaseService } from './databaseService';
import { redisService } from './redisService';
import { securityLogger } from '../security/logging';
import { statfs } from 'node:fs';
import { promisify } from 'node:util';
import { platform } from 'node:os';

const statfsAsync = promisify(statfs);

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
  lastChecked: string;
}

export interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  services: {
    [key: string]: boolean;
  };
}

class HealthService {
  private startTime: number;
  private version: string;
  private environment: string;
  private healthCheckInterval: unknown | null = null;
  private lastHealthStatus: HealthStatus | null = null;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '8.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize health service with periodic checks
   */
  initialize(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        securityLogger.error('Scheduled health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, 30000);

    securityLogger.info('Health service initialized', {
      checkInterval: '30s',
      version: this.version,
      environment: this.environment,
    });
  }

  /**
   * Perform comprehensive health check
   */
  async getHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    try {
      const checks = await this.runAllHealthChecks();

      // Determine overall status
      const statuses = Object.values(checks).map(check => check.status);
      const overallStatus = this.determineOverallStatus(statuses);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp,
        uptime,
        version: this.version,
        environment: this.environment,
        checks,
      };

      this.lastHealthStatus = healthStatus;
      return healthStatus;
    } catch (_error) {
      securityLogger.error('Health check failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });

      return {
        status: 'unhealthy',
        timestamp,
        uptime,
        version: this.version,
        environment: this.environment,
        checks: {
          system: {
            status: 'unhealthy',
            error: _error instanceof Error ? _error.message : 'Health check failed',
            lastChecked: timestamp,
          },
        },
      };
    }
  }

  /**
   * Check if application is ready to serve traffic
   */
  async getReadiness(): Promise<ReadinessStatus> {
    const timestamp = new Date().toISOString();

    try {
      const services = {
        database: await this.checkDatabaseReadiness(),
        configuration: this.checkConfigurationReadiness(),
        security: this.checkSecurityReadiness(),
      };

      const ready = Object.values(services).every(status => status === true);

      return {
        ready,
        timestamp,
        services,
      };
    } catch (_error) {
      securityLogger.error('Readiness check failed', {
        error: _error instanceof Error ? _error.message : 'Unknown error',
      });

      return {
        ready: false,
        timestamp,
        services: {
          database: false,
          configuration: false,
          security: false,
        },
      };
    }
  }

  /**
   * Get basic liveness status
   */
  getLiveness(): { alive: boolean; timestamp: string; uptime: number } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Run all health checks in parallel
   */
  private async runAllHealthChecks(): Promise<{ [key: string]: ComponentHealth }> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkEnvironmentVariables(),
      this.checkSecurity(),
    ]);

    return {
      database: this.processCheckResult(checks[0], 'database'),
      redis: this.processCheckResult(checks[1], 'redis'),
      memory: this.processCheckResult(checks[2], 'memory'),
      disk: this.processCheckResult(checks[3], 'disk'),
      environment: this.processCheckResult(checks[4], 'environment'),
      security: this.processCheckResult(checks[5], 'security'),
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const healthCheck = await databaseService.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: healthCheck.status === 'healthy' ? 'healthy' : 'unhealthy',
        latency,
        details: healthCheck.details,
        lastChecked: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: _error instanceof Error ? _error.message : 'Database check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      if (!redisService.isHealthy()) {
        return {
          status: 'degraded',
          latency: Date.now() - startTime,
          error: 'Redis not connected - using in-memory fallback',
          lastChecked: new Date().toISOString(),
        };
      }

      const healthCheck = await redisService.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: healthCheck.status === 'healthy' ? 'healthy' : 'degraded',
        latency,
        details: healthCheck.details,
        lastChecked: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        error: 'Redis unavailable - using in-memory fallback',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<ComponentHealth> {
    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal;
      const usedMemory = usage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent),
          external: Math.round(usage.external / 1024 / 1024), // MB
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        error: _error instanceof Error ? _error.message : 'Memory check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check disk space (simplified for cross-platform compatibility)
   */
  /**
   * Check disk space across platforms
   */
  private async checkDiskSpace(): Promise<ComponentHealth> {
    try {
      const currentPlatform = platform();

      // Determine the path to check based on platform
      const pathToCheck = currentPlatform === 'win32' ? 'C:\\' : '/';

      // Get filesystem statistics
      const stats = await statfsAsync(pathToCheck);

      // Calculate disk space metrics
      const blockSize = stats.bsize;
      const totalBlocks = stats.blocks;
      const availableBlocks = stats.bavail;

      const totalBytes = totalBlocks * blockSize;
      const availableBytes = availableBlocks * blockSize;
      const usedBytes = totalBytes - availableBytes;
      const percentUsed = (usedBytes / totalBytes) * 100;

      // Convert to GB for readability
      const totalGB = (totalBytes / 1024 ** 3).toFixed(2);
      const availableGB = (availableBytes / 1024 ** 3).toFixed(2);
      const usedGB = (usedBytes / 1024 ** 3).toFixed(2);

      // Determine health status based on disk usage
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (percentUsed < 80) {
        status = 'healthy';
      } else if (percentUsed < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        details: {
          path: pathToCheck,
          platform: currentPlatform,
          totalGB,
          availableGB,
          usedGB,
          percentUsed: percentUsed.toFixed(2) + '%',
          warning: percentUsed >= 80 ? 'Disk space running low' : undefined,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          platform: platform(),
          note: 'statfs not available on this platform or insufficient permissions',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<ComponentHealth> {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return {
        status: 'unhealthy',
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        details: { missingVariables: missingVars },
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      details: {
        requiredVariables: requiredVars.length,
        configuredVariables: requiredVars.length - missingVars.length,
      },
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Check security configuration
   */
  private async checkSecurity(): Promise<ComponentHealth> {
    try {
      const issues: string[] = [];

      // Check JWT secret strength
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret || jwtSecret.length < 32) {
        issues.push('JWT secret is too short or missing');
      }

      // Check if running in production with proper settings
      if (process.env.NODE_ENV === 'production') {
        if (process.env.DATABASE_URL?.includes('localhost')) {
          issues.push('Using localhost database in production');
        }
      }

      const status =
        issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'degraded' : 'unhealthy';

      return {
        status,
        details: {
          securityIssues: issues,
          environment: process.env.NODE_ENV,
        },
        error: issues.length > 0 ? `Security issues: ${issues.join(', ')}` : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (_error) {
      return {
        status: 'unhealthy',
        error: _error instanceof Error ? _error.message : 'Security check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check database readiness
   */
  private async checkDatabaseReadiness(): Promise<boolean> {
    try {
      const health = await databaseService.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Check configuration readiness
   */
  private checkConfigurationReadiness(): boolean {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    return requiredVars.every(varName => !!process.env[varName]);
  }

  /**
   * Check security readiness
   */
  private checkSecurityReadiness(): boolean {
    return !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
  }

  /**
   * Process health check result from Promise.allSettled
   */
  private processCheckResult(
    result: PromiseSettledResult<ComponentHealth>,
    checkName: string,
  ): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        error: `${checkName} check failed: ${result.reason}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Determine overall status from individual check statuses
   */
  private determineOverallStatus(
    statuses: Array<'healthy' | 'degraded' | 'unhealthy'>,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Perform background health check
   */
  private async performHealthCheck(): Promise<void> {
    await this.getHealth();
  }

  /**
   * Get last cached health status
   */
  getLastHealthStatus(): HealthStatus | null {
    return this.lastHealthStatus;
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval as any);
      this.healthCheckInterval = null;
    }

    securityLogger.info('Health service shut down');
  }
}

// Singleton instance
export const healthService = new HealthService();
