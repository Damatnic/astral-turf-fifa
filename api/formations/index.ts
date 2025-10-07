import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || 'file:./demo.db',
    },
  },
});

// Demo formations data for when database isn't available
const demoFormations = [
  {
    id: 'demo-formation-1',
    name: '4-3-3 Attacking',
    teamId: 'demo-team-1',
    isDefault: true,
    formation: {
      players: [
        { id: '1', position: { x: 50, y: 90 }, name: 'Goalkeeper', number: 1, role: 'GK' },
        { id: '2', position: { x: 20, y: 70 }, name: 'Left Back', number: 3, role: 'LB' },
        { id: '3', position: { x: 35, y: 70 }, name: 'Center Back', number: 4, role: 'CB' },
        { id: '4', position: { x: 65, y: 70 }, name: 'Center Back', number: 5, role: 'CB' },
        { id: '5', position: { x: 80, y: 70 }, name: 'Right Back', number: 2, role: 'RB' },
        { id: '6', position: { x: 35, y: 50 }, name: 'Midfielder', number: 6, role: 'CM' },
        { id: '7', position: { x: 50, y: 45 }, name: 'Midfielder', number: 8, role: 'CM' },
        { id: '8', position: { x: 65, y: 50 }, name: 'Midfielder', number: 10, role: 'CM' },
        { id: '9', position: { x: 25, y: 25 }, name: 'Left Winger', number: 11, role: 'LW' },
        { id: '10', position: { x: 50, y: 20 }, name: 'Striker', number: 9, role: 'ST' },
        { id: '11', position: { x: 75, y: 25 }, name: 'Right Winger', number: 7, role: 'RW' },
      ],
      tactical: {
        formation: '4-3-3',
        style: 'Attacking',
        instructions: ['High pressing', 'Quick passing', 'Wide attacks'],
      },
    },
    team: { id: 'demo-team-1', name: 'Demo Team', shortName: 'DEMO' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createFormationSchema = z.object({
  name: z.string().min(1, 'Formation name is required'),
  teamId: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  formation: z.object({
    players: z.array(
      z.object({
        id: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        name: z.string(),
        number: z.number(),
        role: z.string(),
      }),
    ),
    tactical: z
      .object({
        formation: z.string(),
        style: z.string(),
        instructions: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

/**
 * Vercel serverless function for formation management
 * Handles CRUD operations for tactical formations
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract and verify JWT token (relaxed for demo)
    const authHeader = req.headers.authorization;
    let userId = 'demo-user';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

      try {
        const decodedToken = jwt.verify(token, jwtSecret) as any;
        userId = decodedToken.userId || 'demo-user';
      } catch (jwtError) {
        // In demo mode, continue with demo user instead of failing
        console.log('JWT verification failed, using demo user:', (jwtError as Error).message);
        userId = 'demo-user';
      }
    }

    await prisma.$connect();

    switch (req.method) {
      case 'GET':
        return await handleGetFormations(req, res, userId);

      case 'POST':
        return await handleCreateFormation(req, res, userId);

      case 'PUT':
        return await handleUpdateFormation(req, res, userId);

      case 'DELETE':
        return await handleDeleteFormation(req, res, userId);

      default:
        return res.status(405).json({
          error: 'Method not allowed',
          message: `Method ${req.method} is not supported`,
        });
    }
  } catch (error) {
    console.error('Formation API error:', error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request',
    });
  }
}

/**
 * Handle GET requests - retrieve formations
 */
async function handleGetFormations(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const { teamId } = req.query;
    let formations;
    let demoMode = false;

    try {
      await prisma.$connect();

      if (teamId) {
        formations = await prisma.formation.findMany({
          where: {
            teamId: teamId as string,
          },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
          },
          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
      } else {
        formations = await prisma.formation.findMany({
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
          },
          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
      }

      await prisma.$disconnect();
    } catch (dbError) {
      // Database not available, use demo data
      console.log('Database not available, using demo formations:', (dbError as Error).message);
      demoMode = true;

      if (teamId) {
        formations = demoFormations.filter(f => f.teamId === teamId);
      } else {
        formations = demoFormations;
      }
    }

    return res.status(200).json({
      success: true,
      data: formations,
      count: formations.length,
      demoMode,
      message: demoMode ? 'Running in demo mode with sample formations' : 'Live data from database',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching formations:', error);
    throw error;
  }
}

/**
 * Handle POST requests - create new formation
 */
async function handleCreateFormation(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const validationResult = createFormationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { name, teamId, isDefault, formation } = validationResult.data;

    // If this is set as default, unset other defaults for the same team
    if (isDefault && teamId) {
      await prisma.formation.updateMany({
        where: {
          teamId: teamId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newFormation = await prisma.formation.create({
      data: {
        name,
        teamId: teamId || null,
        isDefault,
        formation: formation as any,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    });

    // Log formation creation
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Formation created: ${name}`,
        userId,
        metadata: {
          formationId: newFormation.id,
          formationName: name,
          teamId,
          isDefault,
        },
      },
    });

    await prisma.$disconnect();

    return res.status(201).json({
      success: true,
      message: 'Formation created successfully',
      data: newFormation,
    });
  } catch (error) {
    console.error('Error creating formation:', error);
    throw error;
  }
}

/**
 * Handle PUT requests - update existing formation
 */
async function handleUpdateFormation(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Formation ID is required',
      });
    }

    const validationResult = createFormationSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const updateData = validationResult.data;

    // Check if formation exists
    const existingFormation = await prisma.formation.findUnique({
      where: { id: id as string },
    });

    if (!existingFormation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Formation not found',
      });
    }

    // If this is set as default, unset other defaults for the same team
    if (updateData.isDefault && existingFormation.teamId) {
      await prisma.formation.updateMany({
        where: {
          teamId: existingFormation.teamId,
          isDefault: true,
          id: { not: id as string },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedFormation = await prisma.formation.update({
      where: { id: id as string },
      data: updateData as any,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    });

    // Log formation update
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Formation updated: ${updatedFormation.name}`,
        userId,
        metadata: {
          formationId: updatedFormation.id,
          formationName: updatedFormation.name,
          changes: updateData,
        },
      },
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Formation updated successfully',
      data: updatedFormation,
    });
  } catch (error) {
    console.error('Error updating formation:', error);
    throw error;
  }
}

/**
 * Handle DELETE requests - delete formation
 */
async function handleDeleteFormation(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Formation ID is required',
      });
    }

    // Check if formation exists
    const existingFormation = await prisma.formation.findUnique({
      where: { id: id as string },
    });

    if (!existingFormation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Formation not found',
      });
    }

    await prisma.formation.delete({
      where: { id: id as string },
    });

    // Log formation deletion
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Formation deleted: ${existingFormation.name}`,
        userId,
        metadata: {
          formationId: existingFormation.id,
          formationName: existingFormation.name,
        },
      },
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Formation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting formation:', error);
    throw error;
  }
}
