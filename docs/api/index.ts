/**
 * Astral Turf API Documentation System
 *
 * This module provides comprehensive API documentation with interactive examples,
 * type definitions, and validation for all application endpoints and services.
 */

import { z } from 'zod';
import type {
  Player,
  Formation,
  TeamTactics,
  AIInsight,
  MatchResult,
  TrainingSession,
  TransferPlayer,
} from '../../src/types';

// Define APIResponse locally since it's not exported from types
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// API Documentation Schema
export const ApiDocumentationSchema = z.object({
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  description: z.string(),
  parameters: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      description: z.string(),
      example: z.any().optional(),
    })
  ),
  responseSchema: z.any(),
  examples: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      request: z.any(),
      response: z.any(),
    })
  ),
  errors: z.array(
    z.object({
      code: z.number(),
      message: z.string(),
      description: z.string(),
    })
  ),
});

export type ApiDocumentation = z.infer<typeof ApiDocumentationSchema>;

/**
 * Core API Documentation Registry
 * Contains all documented endpoints with examples and validation
 */
export class ApiDocumentationRegistry {
  private static instance: ApiDocumentationRegistry;
  private documentation: Map<string, ApiDocumentation> = new Map();

  static getInstance(): ApiDocumentationRegistry {
    if (!ApiDocumentationRegistry.instance) {
      ApiDocumentationRegistry.instance = new ApiDocumentationRegistry();
    }
    return ApiDocumentationRegistry.instance;
  }

  /**
   * Register API endpoint documentation
   */
  register(id: string, doc: ApiDocumentation): void {
    this.documentation.set(id, doc);
  }

  /**
   * Get documentation for specific endpoint
   */
  get(id: string): ApiDocumentation | undefined {
    return this.documentation.get(id);
  }

  /**
   * Get all registered documentation
   */
  getAll(): Map<string, ApiDocumentation> {
    return new Map(this.documentation);
  }

  /**
   * Search documentation by keyword
   */
  search(keyword: string): ApiDocumentation[] {
    const results: ApiDocumentation[] = [];
    for (const doc of this.documentation.values()) {
      if (
        doc.endpoint.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.description.toLowerCase().includes(keyword.toLowerCase())
      ) {
        results.push(doc);
      }
    }
    return results;
  }

  /**
   * Validate API response against schema
   */
  validateResponse(endpointId: string, response: any): { valid: boolean; errors?: string[] } {
    const doc = this.get(endpointId);
    if (!doc) {
      return { valid: false, errors: ['Documentation not found for endpoint'] };
    }

    try {
      doc.responseSchema.parse(response);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }
}

// Initialize documentation registry
const registry = ApiDocumentationRegistry.getInstance();

// Player Management API Documentation
registry.register('players.create', {
  endpoint: '/api/players',
  method: 'POST',
  description: 'Create a new player with comprehensive attributes and statistics',
  parameters: [
    {
      name: 'player',
      type: 'Player',
      required: true,
      description: 'Complete player object with all required attributes',
      example: {
        name: 'Lionel Messi',
        position: 'RW',
        team: 'home',
        attributes: {
          pace: 85,
          shooting: 95,
          passing: 92,
          dribbling: 97,
          defending: 35,
          physical: 68,
        },
      },
    },
  ],
  responseSchema: z.object({
    success: z.boolean(),
    data: z.object({
      id: z.string(),
      name: z.string(),
      position: z.string(),
      team: z.enum(['home', 'away']),
      attributes: z.object({
        pace: z.number().min(1).max(99),
        shooting: z.number().min(1).max(99),
        passing: z.number().min(1).max(99),
        dribbling: z.number().min(1).max(99),
        defending: z.number().min(1).max(99),
        physical: z.number().min(1).max(99),
      }),
      overall: z.number().min(1).max(99),
      potential: z.number().min(1).max(99),
      value: z.number().positive(),
      contract: z.object({
        length: z.number(),
        wage: z.number(),
        releaseClause: z.number().optional(),
      }),
    }),
    message: z.string(),
  }),
  examples: [
    {
      title: 'Create World-Class Forward',
      description: 'Example of creating a high-rated attacking player',
      request: {
        name: 'Kylian Mbappé',
        position: 'ST',
        team: 'home',
        attributes: {
          pace: 97,
          shooting: 89,
          passing: 80,
          dribbling: 92,
          defending: 36,
          physical: 77,
        },
        age: 24,
        nationality: 'France',
        preferredFoot: 'right',
      },
      response: {
        success: true,
        data: {
          id: 'player_123',
          name: 'Kylian Mbappé',
          position: 'ST',
          team: 'home',
          attributes: {
            pace: 97,
            shooting: 89,
            passing: 80,
            dribbling: 92,
            defending: 36,
            physical: 77,
          },
          overall: 91,
          potential: 95,
          value: 180000000,
          contract: {
            length: 5,
            wage: 300000,
            releaseClause: 250000000,
          },
        },
        message: 'Player created successfully',
      },
    },
  ],
  errors: [
    {
      code: 400,
      message: 'Invalid player data',
      description: 'Required fields missing or invalid attribute values',
    },
    {
      code: 409,
      message: 'Player already exists',
      description: 'A player with the same name already exists in the team',
    },
  ],
});

// Formation Management API Documentation
registry.register('formations.create', {
  endpoint: '/api/formations',
  method: 'POST',
  description: 'Create custom tactical formation with player positions and tactical instructions',
  parameters: [
    {
      name: 'formation',
      type: 'Formation',
      required: true,
      description: 'Formation configuration with positions and tactics',
      example: {
        name: '4-3-3 Attacking',
        positions: [
          { id: 'gk', x: 50, y: 10, position: 'GK' },
          { id: 'lb', x: 20, y: 25, position: 'LB' },
          { id: 'cb1', x: 35, y: 25, position: 'CB' },
          { id: 'cb2', x: 65, y: 25, position: 'CB' },
          { id: 'rb', x: 80, y: 25, position: 'RB' },
        ],
      },
    },
  ],
  responseSchema: z.object({
    success: z.boolean(),
    data: z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      positions: z.array(
        z.object({
          id: z.string(),
          x: z.number(),
          y: z.number(),
          position: z.string(),
          playerId: z.string().optional(),
        })
      ),
      tactics: z.object({
        defensiveStyle: z.string(),
        offensiveStyle: z.string(),
        pressure: z.number(),
        width: z.number(),
        tempo: z.number(),
      }),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    message: z.string(),
  }),
  examples: [
    {
      title: 'Create High-Pressing 4-3-3',
      description: 'Modern attacking formation with high defensive line',
      request: {
        name: '4-3-3 Gegenpressing',
        type: '4-3-3',
        positions: [
          { id: 'gk', x: 50, y: 5, position: 'GK' },
          { id: 'lb', x: 15, y: 35, position: 'LB' },
          { id: 'cb1', x: 35, y: 30, position: 'CB' },
          { id: 'cb2', x: 65, y: 30, position: 'CB' },
          { id: 'rb', x: 85, y: 35, position: 'RB' },
          { id: 'cdm', x: 50, y: 45, position: 'CDM' },
          { id: 'cm1', x: 35, y: 55, position: 'CM' },
          { id: 'cm2', x: 65, y: 55, position: 'CM' },
          { id: 'lw', x: 20, y: 75, position: 'LW' },
          { id: 'st', x: 50, y: 85, position: 'ST' },
          { id: 'rw', x: 80, y: 75, position: 'RW' },
        ],
        tactics: {
          defensiveStyle: 'high-press',
          offensiveStyle: 'possession',
          pressure: 85,
          width: 75,
          tempo: 80,
        },
      },
      response: {
        success: true,
        data: {
          id: 'formation_456',
          name: '4-3-3 Gegenpressing',
          type: '4-3-3',
          positions: [
            { id: 'gk', x: 50, y: 5, position: 'GK' },
            { id: 'lb', x: 15, y: 35, position: 'LB' },
          ],
          tactics: {
            defensiveStyle: 'high-press',
            offensiveStyle: 'possession',
            pressure: 85,
            width: 75,
            tempo: 80,
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        message: 'Formation created successfully',
      },
    },
  ],
  errors: [
    {
      code: 400,
      message: 'Invalid formation data',
      description: 'Invalid position coordinates or missing required positions',
    },
    {
      code: 422,
      message: 'Formation validation failed',
      description: 'Formation does not meet tactical requirements (e.g., no goalkeeper)',
    },
  ],
});

// AI Analysis API Documentation
registry.register('ai.analyze', {
  endpoint: '/api/ai/analyze',
  method: 'POST',
  description:
    'Generate AI-powered tactical analysis and insights for current formation and team setup',
  parameters: [
    {
      name: 'analysisRequest',
      type: 'AIAnalysisRequest',
      required: true,
      description: 'Analysis parameters and context',
      example: {
        formationId: 'formation_456',
        playerIds: ['player_123', 'player_456'],
        analysisType: 'tactical',
        opposition: {
          formation: '4-4-2',
          style: 'defensive',
        },
      },
    },
  ],
  responseSchema: z.object({
    success: z.boolean(),
    data: z.object({
      insights: z.array(
        z.object({
          type: z.enum(['strength', 'weakness', 'opportunity', 'threat']),
          category: z.string(),
          title: z.string(),
          description: z.string(),
          confidence: z.number().min(0).max(1),
          actionable: z.boolean(),
          recommendations: z.array(z.string()).optional(),
        })
      ),
      overallRating: z.number().min(0).max(100),
      keyRecommendations: z.array(z.string()),
      tacticalAdjustments: z.array(
        z.object({
          type: z.string(),
          description: z.string(),
          impact: z.enum(['low', 'medium', 'high']),
          difficulty: z.enum(['easy', 'medium', 'hard']),
        })
      ),
      playerHighlights: z.array(
        z.object({
          playerId: z.string(),
          insight: z.string(),
          rating: z.number().min(0).max(10),
        })
      ),
    }),
    processingTime: z.number(),
    message: z.string(),
  }),
  examples: [
    {
      title: 'Tactical Analysis for 4-3-3',
      description: 'Comprehensive AI analysis of formation effectiveness',
      request: {
        formationId: 'formation_456',
        playerIds: ['messi_123', 'mbappe_456', 'modric_789'],
        analysisType: 'tactical',
        opposition: {
          formation: '5-3-2',
          style: 'counter-attack',
        },
        context: {
          matchType: 'league',
          homeAdvantage: true,
          weather: 'clear',
        },
      },
      response: {
        success: true,
        data: {
          insights: [
            {
              type: 'strength',
              category: 'attacking',
              title: 'Excellent Wing Play',
              description:
                'Your wide forwards create significant attacking threat with pace and dribbling ability',
              confidence: 0.92,
              actionable: true,
              recommendations: ['Focus attacks through wings', 'Use overlapping fullbacks'],
            },
            {
              type: 'weakness',
              category: 'defensive',
              title: 'Vulnerable to Counter-Attacks',
              description: 'High defensive line exposed to quick transitions',
              confidence: 0.85,
              actionable: true,
              recommendations: ['Deeper defensive line', 'More defensive midfielder cover'],
            },
          ],
          overallRating: 78,
          keyRecommendations: [
            'Exploit wing positions against 5-3-2',
            'Maintain possession to prevent counters',
            'Use midfield overload in central areas',
          ],
          tacticalAdjustments: [
            {
              type: 'formation',
              description: 'Drop defensive line 10 yards deeper',
              impact: 'medium',
              difficulty: 'easy',
            },
          ],
          playerHighlights: [
            {
              playerId: 'messi_123',
              insight: 'Perfect position to exploit space between opposition lines',
              rating: 9.2,
            },
          ],
        },
        processingTime: 1.2,
        message: 'Analysis completed successfully',
      },
    },
  ],
  errors: [
    {
      code: 400,
      message: 'Invalid analysis request',
      description: 'Missing required parameters or invalid formation/player IDs',
    },
    {
      code: 429,
      message: 'Rate limit exceeded',
      description: 'Too many AI analysis requests. Please wait before trying again',
    },
    {
      code: 503,
      message: 'AI service unavailable',
      description: 'AI analysis service is temporarily unavailable',
    },
  ],
});

// Match Simulation API Documentation
registry.register('match.simulate', {
  endpoint: '/api/match/simulate',
  method: 'POST',
  description: 'Simulate a complete football match with realistic events and statistics',
  parameters: [
    {
      name: 'matchConfig',
      type: 'MatchSimulationConfig',
      required: true,
      description: 'Match setup and simulation parameters',
      example: {
        homeTeam: {
          formationId: 'formation_433',
          tactics: { pressure: 75, tempo: 80, width: 70 },
        },
        awayTeam: {
          formationId: 'formation_442',
          tactics: { pressure: 60, tempo: 65, width: 60 },
        },
        difficulty: 'realistic',
        matchLength: 90,
      },
    },
  ],
  responseSchema: z.object({
    success: z.boolean(),
    data: z.object({
      matchId: z.string(),
      result: z.object({
        homeScore: z.number(),
        awayScore: z.number(),
        winner: z.enum(['home', 'away', 'draw']),
      }),
      statistics: z.object({
        possession: z.object({
          home: z.number(),
          away: z.number(),
        }),
        shots: z.object({
          home: z.number(),
          away: z.number(),
        }),
        shotsOnTarget: z.object({
          home: z.number(),
          away: z.number(),
        }),
        corners: z.object({
          home: z.number(),
          away: z.number(),
        }),
        fouls: z.object({
          home: z.number(),
          away: z.number(),
        }),
      }),
      events: z.array(
        z.object({
          minute: z.number(),
          type: z.enum(['goal', 'yellow', 'red', 'substitution', 'injury']),
          team: z.enum(['home', 'away']),
          player: z.string(),
          description: z.string(),
        })
      ),
      playerRatings: z.record(z.number().min(1).max(10)),
      tacticalNotes: z.array(z.string()),
      duration: z.number(),
    }),
    message: z.string(),
  }),
  examples: [
    {
      title: 'Simulate Premier League Match',
      description: 'Realistic match simulation with detailed statistics',
      request: {
        homeTeam: {
          formationId: 'formation_433_attacking',
          players: ['kane_st', 'sterling_lw', 'saka_rw'],
          tactics: {
            pressure: 80,
            tempo: 85,
            width: 75,
            defensiveStyle: 'medium-block',
          },
        },
        awayTeam: {
          formationId: 'formation_442_defensive',
          players: ['haaland_st', 'grealish_lw'],
          tactics: {
            pressure: 60,
            tempo: 70,
            width: 65,
            defensiveStyle: 'low-block',
          },
        },
        venue: 'home',
        difficulty: 'realistic',
        weather: 'clear',
        attendance: 75000,
      },
      response: {
        success: true,
        data: {
          matchId: 'match_789',
          result: {
            homeScore: 2,
            awayScore: 1,
            winner: 'home',
          },
          statistics: {
            possession: { home: 58, away: 42 },
            shots: { home: 16, away: 11 },
            shotsOnTarget: { home: 7, away: 4 },
            corners: { home: 8, away: 3 },
            fouls: { home: 12, away: 15 },
          },
          events: [
            {
              minute: 23,
              type: 'goal',
              team: 'home',
              player: 'kane_st',
              description: 'Harry Kane scores from close range after Sterling cross',
            },
            {
              minute: 67,
              type: 'goal',
              team: 'away',
              player: 'haaland_st',
              description: 'Erling Haaland equalizes with powerful header',
            },
            {
              minute: 89,
              type: 'goal',
              team: 'home',
              player: 'saka_rw',
              description: 'Bukayo Saka scores dramatic winner from outside the box',
            },
          ],
          playerRatings: {
            kane_st: 8.5,
            sterling_lw: 7.8,
            saka_rw: 9.1,
            haaland_st: 7.9,
          },
          tacticalNotes: [
            'Home team dominated possession in first half',
            'Away team improved after switching to 3-5-2',
            'Late pressure from home team paid off',
          ],
          duration: 2.8,
        },
        message: 'Match simulation completed',
      },
    },
  ],
  errors: [
    {
      code: 400,
      message: 'Invalid match configuration',
      description: 'Missing required teams or invalid formation IDs',
    },
    {
      code: 422,
      message: 'Team validation failed',
      description: 'Teams do not have required number of players or invalid positions',
    },
  ],
});

export default registry;
