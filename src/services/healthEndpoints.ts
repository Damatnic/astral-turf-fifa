/**
 * Health Check Endpoints - Express-style endpoints for health monitoring
 *
 * Provides standard health check endpoints that can be integrated with
 * load balancers, monitoring systems, and orchestration platforms.
 */

import { healthService, HealthStatus, ReadinessStatus } from './healthService';
import { securityLogger } from '../security/logging';

export interface HealthEndpointResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Health endpoint - comprehensive health check
 * GET /health
 */
export async function healthEndpoint(): Promise<HealthEndpointResponse> {
  try {
    const health: HealthStatus = await healthService.getHealth();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: health,
    };
  } catch (_error) {
    securityLogger.error('Health endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Readiness endpoint - checks if application is ready to serve traffic
 * GET /ready
 */
export async function readinessEndpoint(): Promise<HealthEndpointResponse> {
  try {
    const readiness: ReadinessStatus = await healthService.getReadiness();

    const statusCode = readiness.ready ? 200 : 503;

    return {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: readiness,
    };
  } catch (_error) {
    securityLogger.error('Readiness endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        ready: false,
        error: 'Readiness check failed',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Liveness endpoint - basic liveness probe
 * GET /live
 */
export async function livenessEndpoint(): Promise<HealthEndpointResponse> {
  try {
    const liveness = healthService.getLiveness();

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: liveness,
    };
  } catch (_error) {
    return {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        alive: false,
        error: 'Liveness check failed',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Metrics endpoint - basic application metrics
 * GET /metrics
 */
export async function metricsEndpoint(): Promise<HealthEndpointResponse> {
  try {
    const health = await healthService.getHealth();
    const liveness = healthService.getLiveness();

    // Basic Prometheus-style metrics
    const metrics = `
# HELP astralturf_health_status Application health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE astralturf_health_status gauge
astralturf_health_status{version="${health.version}",environment="${health.environment}"} ${
      health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0
    }

# HELP astralturf_uptime_seconds Application uptime in seconds
# TYPE astralturf_uptime_seconds counter
astralturf_uptime_seconds{version="${health.version}",environment="${health.environment}"} ${Math.floor(liveness.uptime / 1000)}

# HELP astralturf_database_status Database connection status (1=healthy, 0=unhealthy)
# TYPE astralturf_database_status gauge
astralturf_database_status{version="${health.version}",environment="${health.environment}"} ${
      health.checks.database?.status === 'healthy' ? 1 : 0
    }

# HELP astralturf_database_latency_ms Database query latency in milliseconds
# TYPE astralturf_database_latency_ms gauge
astralturf_database_latency_ms{version="${health.version}",environment="${health.environment}"} ${
      health.checks.database?.latency || 0
    }

# HELP astralturf_memory_usage_percent Memory usage percentage
# TYPE astralturf_memory_usage_percent gauge
astralturf_memory_usage_percent{version="${health.version}",environment="${health.environment}"} ${
      health.checks.memory?.details?.usagePercent || 0
    }
`.trim();

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: metrics,
    };
  } catch (_error) {
    securityLogger.error('Metrics endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error generating metrics',
    };
  }
}

/**
 * Version endpoint - application version information
 * GET /version
 */
export async function versionEndpoint(): Promise<HealthEndpointResponse> {
  const version = {
    version: process.env.npm_package_version || '8.0.0',
    name: 'Astral Turf',
    environment: process.env.NODE_ENV || 'development',
    buildDate: new Date().toISOString(), // In production, this would be set during build
    commit: process.env.GIT_COMMIT || 'unknown',
    branch: process.env.GIT_BRANCH || 'unknown',
  };

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache version info for 1 hour
    },
    body: version,
  };
}

/**
 * Simple ping endpoint
 * GET /ping
 */
export async function pingEndpoint(): Promise<HealthEndpointResponse> {
  return {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
    body: 'pong',
  };
}

/**
 * Initialize health endpoints in a web server
 * This is a helper function to set up routes in Express or similar
 */
export function setupHealthRoutes(app: unknown): void {
  // Health check endpoints
  app.get('/health', async (req: unknown, res: unknown) => {
    const response = await healthEndpoint();
    res.status(response.status).set(response.headers).json(response.body);
  });

  app.get('/ready', async (req: unknown, res: unknown) => {
    const response = await readinessEndpoint();
    res.status(response.status).set(response.headers).json(response.body);
  });

  app.get('/live', async (req: unknown, res: unknown) => {
    const response = await livenessEndpoint();
    res.status(response.status).set(response.headers).json(response.body);
  });

  app.get('/metrics', async (req: unknown, res: unknown) => {
    const response = await metricsEndpoint();
    res.status(response.status).set(response.headers).send(response.body);
  });

  app.get('/version', async (req: unknown, res: unknown) => {
    const response = await versionEndpoint();
    res.status(response.status).set(response.headers).json(response.body);
  });

  app.get('/ping', async (req: unknown, res: unknown) => {
    const response = await pingEndpoint();
    res.status(response.status).set(response.headers).send(response.body);
  });

  securityLogger.info('Health check endpoints configured', {
    endpoints: ['/health', '/ready', '/live', '/metrics', '/version', '/ping'],
  });
}

/**
 * For Vite dev server integration, we can create a simple middleware
 */
export function createHealthMiddleware() {
  return async (req: unknown, res: unknown, next: unknown) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    let response: HealthEndpointResponse | null = null;

    switch (url.pathname) {
      case '/health':
        response = await healthEndpoint();
        break;
      case '/ready':
        response = await readinessEndpoint();
        break;
      case '/live':
        response = await livenessEndpoint();
        break;
      case '/metrics':
        response = await metricsEndpoint();
        break;
      case '/version':
        response = await versionEndpoint();
        break;
      case '/ping':
        response = await pingEndpoint();
        break;
      default:
        return next();
    }

    if (response) {
      res.writeHead(response.status, response.headers);
      res.end(typeof response.body === 'string' ? response.body : JSON.stringify(response.body));
      return;
    }

    next();
  };
}
