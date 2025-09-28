import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

/**
 * Health check endpoint for Vercel deployment
 * Tests database connectivity and application status
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const startTime = Date.now();
    
    // Test database connectivity
    await prisma.$connect();
    const dbResult = await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const dbResponseTime = Date.now() - startTime;
    
    // Get basic system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      vercel: process.env.VERCEL === '1',
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Test database schema by checking if tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'teams', 'players', 'formations')
      ORDER BY table_name
    `;

    await prisma.$disconnect();

    return res.status(200).json({
      status: 'healthy',
      message: 'Astral Turf Tactical Board API is running',
      version: '8.0.0',
      checks: {
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`,
          tablesFound: Array.isArray(tableCheck) ? tableCheck.length : 0
        },
        api: {
          status: 'operational',
          responseTime: `${Date.now() - startTime}ms`
        },
        system: systemInfo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    return res.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Database connection failed'
        },
        api: {
          status: 'degraded'
        }
      }
    });
  }
}