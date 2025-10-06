import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

const analyticsEventSchema = z.object({
  eventType: z.string().min(1),
  page: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Vercel serverless function for analytics tracking
 * Handles custom analytics events and metrics collection
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await prisma.$connect();

    switch (req.method) {
      case 'POST':
        return await handleTrackEvent(req, res);

      case 'GET':
        return await handleGetAnalytics(req, res);

      default:
        return res.status(405).json({
          error: 'Method not allowed',
          message: `Method ${req.method} is not supported`,
        });
    }
  } catch (error) {
    console.error('Analytics API error:', error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing analytics request',
    });
  }
}

/**
 * Handle POST requests - track analytics events
 */
async function handleTrackEvent(req: VercelRequest, res: VercelResponse) {
  try {
    const validationResult = analyticsEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { eventType, page, userId, sessionId, metadata } = validationResult.data;

    // Get client information
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers.referer || req.headers.referrer || null;

    // Create analytics log entry
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Analytics Event: ${eventType}`,
        userId: userId || null,
        sessionId: sessionId || null,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        securityEventType: 'analytics_event',
        metadata: {
          eventType,
          page,
          referer,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    throw error;
  }
}

/**
 * Handle GET requests - retrieve analytics data
 */
async function handleGetAnalytics(req: VercelRequest, res: VercelResponse) {
  try {
    const { startDate, endDate, eventType, page, userId, limit = '100', offset = '0' } = req.query;

    // Build where clause
    const whereClause: any = {
      securityEventType: 'analytics_event',
    };

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (userId) {
      whereClause.userId = userId as string;
    }

    if (eventType || page) {
      whereClause.metadata = {
        path: [],
      };

      if (eventType) {
        whereClause.metadata.path.push(['eventType']);
        whereClause.metadata.equals = eventType;
      }

      if (page) {
        whereClause.metadata.path.push(['page']);
        whereClause.metadata.equals = page;
      }
    }

    // Get analytics events
    const events = await prisma.systemLog.findMany({
      where: whereClause,
      select: {
        id: true,
        message: true,
        timestamp: true,
        userId: true,
        sessionId: true,
        ipAddress: true,
        metadata: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Get total count
    const totalCount = await prisma.systemLog.count({
      where: whereClause,
    });

    // Aggregate data for insights
    const aggregations = await Promise.all([
      // Top pages
      prisma.systemLog.groupBy({
        by: ['metadata'],
        where: whereClause,
        _count: true,
        orderBy: {
          _count: {
            metadata: 'desc',
          },
        },
        take: 10,
      }),

      // Events by hour (last 24 hours)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as event_count
        FROM system_logs 
        WHERE security_event_type = 'analytics_event'
          AND timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour DESC
      `,
    ]);

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string),
        },
        insights: {
          topPages: aggregations[0],
          hourlyEvents: aggregations[1],
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving analytics data:', error);
    throw error;
  }
}
