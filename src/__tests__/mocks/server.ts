import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
  generateFormation,
  generatePlayer,
  generateChallenge,
  generateCollaborationSession,
  generateAnalyticsData,
  generateHeatMapData,
} from '../utils/mock-generators';
import type { Formation, Player, Challenge } from '../../types';

/**
 * MSW (Mock Service Worker) server for API mocking
 * Provides realistic API responses for testing
 */

// Mock data stores
const mockFormations = new Map<string, Formation>();
const mockPlayers = new Map<string, Player>();
const mockChallenges = new Map<string, Challenge>();

// Initialize with some default data
for (let i = 0; i < 5; i++) {
  const formation = generateFormation();
  mockFormations.set(formation.id, formation);
  
  formation.players.forEach(player => {
    mockPlayers.set(player.id, player);
  });
}

for (let i = 0; i < 10; i++) {
  const challenge = generateChallenge();
  mockChallenges.set(challenge.id, challenge);
}

// API handlers
export const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        expiresIn: 3600,
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      })
    );
  }),

  // Formation endpoints
  rest.get('/api/formations', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const search = req.url.searchParams.get('search');
    
    let formations = Array.from(mockFormations.values());
    
    // Apply search filter
    if (search) {
      formations = formations.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFormations = formations.slice(startIndex, endIndex);
    
    return res(
      ctx.status(200),
      ctx.json({
        formations: paginatedFormations,
        total: formations.length,
        page,
        limit,
        totalPages: Math.ceil(formations.length / limit),
      })
    );
  }),

  rest.get('/api/formations/:id', (req, res, ctx) => {
    const { id } = req.params;
    const formation = mockFormations.get(id as string);
    
    if (!formation) {
      return res(ctx.status(404), ctx.json({ error: 'Formation not found' }));
    }
    
    return res(ctx.status(200), ctx.json(formation));
  }),

  rest.post('/api/formations', async (req, res, ctx) => {
    const formationData = await req.json();
    const formation = {
      ...generateFormation(),
      ...formationData,
      id: `formation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockFormations.set(formation.id, formation);
    
    return res(ctx.status(201), ctx.json(formation));
  }),

  rest.put('/api/formations/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    const existingFormation = mockFormations.get(id as string);
    
    if (!existingFormation) {
      return res(ctx.status(404), ctx.json({ error: 'Formation not found' }));
    }
    
    const updatedFormation = {
      ...existingFormation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    mockFormations.set(id as string, updatedFormation);
    
    return res(ctx.status(200), ctx.json(updatedFormation));
  }),

  rest.delete('/api/formations/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    if (!mockFormations.has(id as string)) {
      return res(ctx.status(404), ctx.json({ error: 'Formation not found' }));
    }
    
    mockFormations.delete(id as string);
    
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // Player endpoints
  rest.get('/api/players', (req, res, ctx) => {
    const position = req.url.searchParams.get('position');
    const team = req.url.searchParams.get('team');
    
    let players = Array.from(mockPlayers.values());
    
    if (position) {
      players = players.filter(p => p.position === position);
    }
    
    if (team) {
      players = players.filter(p => p.team === team);
    }
    
    return res(ctx.status(200), ctx.json(players));
  }),

  rest.get('/api/players/:id', (req, res, ctx) => {
    const { id } = req.params;
    const player = mockPlayers.get(id as string);
    
    if (!player) {
      return res(ctx.status(404), ctx.json({ error: 'Player not found' }));
    }
    
    return res(ctx.status(200), ctx.json(player));
  }),

  rest.put('/api/players/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    const existingPlayer = mockPlayers.get(id as string);
    
    if (!existingPlayer) {
      return res(ctx.status(404), ctx.json({ error: 'Player not found' }));
    }
    
    const updatedPlayer = { ...existingPlayer, ...updates };
    mockPlayers.set(id as string, updatedPlayer);
    
    return res(ctx.status(200), ctx.json(updatedPlayer));
  }),

  // Challenge endpoints
  rest.get('/api/challenges', (req, res, ctx) => {
    const type = req.url.searchParams.get('type');
    const difficulty = req.url.searchParams.get('difficulty');
    const completed = req.url.searchParams.get('completed');
    
    let challenges = Array.from(mockChallenges.values());
    
    if (type) {
      challenges = challenges.filter(c => c.type === type);
    }
    
    if (difficulty) {
      challenges = challenges.filter(c => c.difficulty === difficulty);
    }
    
    if (completed !== null) {
      challenges = challenges.filter(c => c.isCompleted === (completed === 'true'));
    }
    
    return res(ctx.status(200), ctx.json(challenges));
  }),

  rest.get('/api/challenges/:id', (req, res, ctx) => {
    const { id } = req.params;
    const challenge = mockChallenges.get(id as string);
    
    if (!challenge) {
      return res(ctx.status(404), ctx.json({ error: 'Challenge not found' }));
    }
    
    return res(ctx.status(200), ctx.json(challenge));
  }),

  rest.post('/api/challenges/:id/complete', async (req, res, ctx) => {
    const { id } = req.params;
    const challenge = mockChallenges.get(id as string);
    
    if (!challenge) {
      return res(ctx.status(404), ctx.json({ error: 'Challenge not found' }));
    }
    
    const completedChallenge = {
      ...challenge,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      progress: 100,
    };
    
    mockChallenges.set(id as string, completedChallenge);
    
    return res(ctx.status(200), ctx.json(completedChallenge));
  }),

  // Analytics endpoints
  rest.get('/api/analytics/formation/:id', (req, res, ctx) => {
    const { id } = req.params;
    const formation = mockFormations.get(id as string);
    
    if (!formation) {
      return res(ctx.status(404), ctx.json({ error: 'Formation not found' }));
    }
    
    const analytics = generateAnalyticsData();
    
    return res(ctx.status(200), ctx.json(analytics));
  }),

  rest.get('/api/analytics/heatmap/:playerId', (req, res, ctx) => {
    const { playerId } = req.params;
    const player = mockPlayers.get(playerId as string);
    
    if (!player) {
      return res(ctx.status(404), ctx.json({ error: 'Player not found' }));
    }
    
    const heatMapData = generateHeatMapData([player]);
    
    return res(ctx.status(200), ctx.json(heatMapData));
  }),

  // Collaboration endpoints
  rest.get('/api/collaboration/sessions', (req, res, ctx) => {
    const sessions = Array.from({ length: 3 }, () => generateCollaborationSession());
    
    return res(ctx.status(200), ctx.json(sessions));
  }),

  rest.post('/api/collaboration/sessions', async (req, res, ctx) => {
    const sessionData = await req.json();
    const session = {
      ...generateCollaborationSession(),
      ...sessionData,
      id: `session-${Date.now()}`,
    };
    
    return res(ctx.status(201), ctx.json(session));
  }),

  // Export/Import endpoints
  rest.post('/api/export/formation/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const { format } = await req.json();
    const formation = mockFormations.get(id as string);
    
    if (!formation) {
      return res(ctx.status(404), ctx.json({ error: 'Formation not found' }));
    }
    
    // Simulate export processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const exportData = {
      url: `https://example.com/exports/${id}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    return res(ctx.status(200), ctx.json(exportData));
  }),

  rest.post('/api/import/formation', async (req, res, ctx) => {
    const formData = await req.json();
    
    // Simulate import processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const importedFormation = generateFormation({
      name: `Imported ${formData.name || 'Formation'}`,
      description: 'Imported formation',
    });
    
    mockFormations.set(importedFormation.id, importedFormation);
    
    return res(ctx.status(201), ctx.json(importedFormation));
  }),

  // Error simulation endpoints for testing error handling
  rest.get('/api/test/error/:statusCode', (req, res, ctx) => {
    const statusCode = parseInt(req.params.statusCode as string);
    
    return res(
      ctx.status(statusCode),
      ctx.json({ error: `Test error with status ${statusCode}` })
    );
  }),

  rest.get('/api/test/timeout', (req, res, ctx) => {
    // Simulate timeout by never responding
    return new Promise(() => {});
  }),

  rest.get('/api/test/slow', async (req, res, ctx) => {
    // Simulate slow response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return res(ctx.status(200), ctx.json({ message: 'Slow response' }));
  }),

  // WebSocket simulation for real-time features
  rest.get('/api/ws/collaboration/:sessionId', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: `ws://localhost:3001/collaboration/${req.params.sessionId}`,
        token: 'mock-ws-token',
      })
    );
  }),
];

// Create and configure the server
export const server = setupServer(...handlers);

// Server utilities for tests
export const serverUtils = {
  // Add custom handlers for specific tests
  addHandlers: (...handlers: any[]) => {
    server.use(...handlers);
  },
  
  // Reset to default handlers
  resetHandlers: () => {
    server.resetHandlers(...handlers);
  },
  
  // Simulate network conditions
  simulateNetworkError: (path: string) => {
    server.use(
      rest.get(path, (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );
  },
  
  simulateServerError: (path: string, statusCode = 500) => {
    server.use(
      rest.get(path, (req, res, ctx) => {
        return res(
          ctx.status(statusCode),
          ctx.json({ error: 'Server error' })
        );
      })
    );
  },
  
  simulateSlowResponse: (path: string, delay = 3000) => {
    server.use(
      rest.get(path, async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return res(ctx.status(200), ctx.json({ message: 'Delayed response' }));
      })
    );
  },
  
  // Mock data utilities
  addFormation: (formation: Formation) => {
    mockFormations.set(formation.id, formation);
  },
  
  addPlayer: (player: Player) => {
    mockPlayers.set(player.id, player);
  },
  
  addChallenge: (challenge: Challenge) => {
    mockChallenges.set(challenge.id, challenge);
  },
  
  clearMockData: () => {
    mockFormations.clear();
    mockPlayers.clear();
    mockChallenges.clear();
  },
  
  getMockData: () => ({
    formations: Array.from(mockFormations.values()),
    players: Array.from(mockPlayers.values()),
    challenges: Array.from(mockChallenges.values()),
  }),
};