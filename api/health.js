/**
 * Vercel Health Check API Endpoint
 *
 * Provides health status for the Astral Turf application
 * with database connectivity and service health checks.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      checks: {},
    };

    // Database health check
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;

      health.checks.database = {
        status: 'healthy',
        latency: dbLatency,
        lastChecked: new Date().toISOString(),
      };
    } catch (dbError) {
      health.status = 'unhealthy';
      health.checks.database = {
        status: 'unhealthy',
        error: dbError.message,
        lastChecked: new Date().toISOString(),
      };
    }

    // Environment variables check
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    health.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
      details: {
        requiredVars: requiredEnvVars.length,
        missingVars: missingEnvVars.length,
        missing: missingEnvVars,
      },
      lastChecked: new Date().toISOString(),
    };

    if (missingEnvVars.length > 0) {
      health.status = 'degraded';
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    health.checks.memory = {
      status: memoryUsagePercent < 90 ? 'healthy' : 'degraded',
      details: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        usagePercent: Math.round(memoryUsagePercent),
      },
      lastChecked: new Date().toISOString(),
    };

    // Response time check
    const responseTime = Date.now() - startTime;
    health.responseTime = responseTime;

    // Determine overall status
    const statuses = Object.values(health.checks).map(check => check.status);
    if (statuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      health.status = 'degraded';
    }

    // Set appropriate HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  } finally {
    await prisma.$disconnect();
  }
}
