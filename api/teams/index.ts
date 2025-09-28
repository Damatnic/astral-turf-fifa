import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be 10 characters or less'),
  logoUrl: z.string().url().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  stadium: z.string().optional()
});

/**
 * Vercel serverless function for team management
 * Handles CRUD operations for football teams
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
    // Extract and verify JWT token for protected routes
    if (req.method !== 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid authentication token provided'
        });
      }

      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      
      try {
        jwt.verify(token, jwtSecret);
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authentication token'
        });
      }
    }

    await prisma.$connect();

    switch (req.method) {
      case 'GET':
        return await handleGetTeams(req, res);
      
      case 'POST':
        return await handleCreateTeam(req, res);
      
      case 'PUT':
        return await handleUpdateTeam(req, res);
      
      case 'DELETE':
        return await handleDeleteTeam(req, res);
      
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          message: `Method ${req.method} is not supported`
        });
    }

  } catch (error) {
    console.error('Teams API error:', error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing your request'
    });
  }
}

/**
 * Handle GET requests - retrieve teams
 */
async function handleGetTeams(req: VercelRequest, res: VercelResponse) {
  try {
    const { id, include_players, include_formations } = req.query;

    if (id) {
      // Get specific team
      const team = await prisma.team.findUnique({
        where: { id: id as string },
        include: {
          players: include_players === 'true' ? {
            select: {
              id: true,
              name: true,
              position: true,
              jerseyNumber: true,
              age: true,
              nationality: true,
              isActive: true
            }
          } : false,
          formations: include_formations === 'true' ? {
            select: {
              id: true,
              name: true,
              isDefault: true,
              createdAt: true,
              updatedAt: true
            }
          } : false,
          _count: {
            select: {
              players: true,
              formations: true,
              matches: true
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Team not found'
        });
      }

      await prisma.$disconnect();

      return res.status(200).json({
        success: true,
        data: team
      });

    } else {
      // Get all teams
      const teams = await prisma.team.findMany({
        include: {
          _count: {
            select: {
              players: true,
              formations: true,
              matches: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      await prisma.$disconnect();

      return res.status(200).json({
        success: true,
        data: teams,
        count: teams.length
      });
    }

  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Handle POST requests - create new team
 */
async function handleCreateTeam(req: VercelRequest, res: VercelResponse) {
  try {
    const validationResult = createTeamSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const teamData = validationResult.data;

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { name: teamData.name },
          { shortName: teamData.shortName }
        ]
      }
    });

    if (existingTeam) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A team with this name or short name already exists'
      });
    }

    const newTeam = await prisma.team.create({
      data: teamData,
      include: {
        _count: {
          select: {
            players: true,
            formations: true,
            matches: true
          }
        }
      }
    });

    await prisma.$disconnect();

    return res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: newTeam
    });

  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

/**
 * Handle PUT requests - update existing team
 */
async function handleUpdateTeam(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Team ID is required'
      });
    }

    const validationResult = createTeamSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const updateData = validationResult.data;

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: id as string }
    });

    if (!existingTeam) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Team not found'
      });
    }

    // Check for name conflicts (excluding current team)
    if (updateData.name || updateData.shortName) {
      const conflictingTeam = await prisma.team.findFirst({
        where: {
          AND: [
            { id: { not: id as string } },
            {
              OR: [
                updateData.name ? { name: updateData.name } : {},
                updateData.shortName ? { shortName: updateData.shortName } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      });

      if (conflictingTeam) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A team with this name or short name already exists'
        });
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: id as string },
      data: updateData,
      include: {
        _count: {
          select: {
            players: true,
            formations: true,
            matches: true
          }
        }
      }
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });

  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
}

/**
 * Handle DELETE requests - delete team
 */
async function handleDeleteTeam(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Team ID is required'
      });
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: {
            players: true,
            formations: true,
            matches: true
          }
        }
      }
    });

    if (!existingTeam) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Team not found'
      });
    }

    // Check if team has dependent records
    if (existingTeam._count.players > 0 || existingTeam._count.formations > 0 || existingTeam._count.matches > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete team with existing players, formations, or matches',
        dependencies: {
          players: existingTeam._count.players,
          formations: existingTeam._count.formations,
          matches: existingTeam._count.matches
        }
      });
    }

    await prisma.team.delete({
      where: { id: id as string }
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
}