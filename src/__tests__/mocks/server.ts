import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  generateFormation,
  generateChallenge,
  generateCollaborationSession,
  generateAnalyticsData,
  generateHeatMapData,
} from '../utils/mock-generators';

type MockEntity = Record<string, unknown> & { id: string };
type MockPlayer = MockEntity;
type MockFormation = MockEntity & { players?: MockPlayer[] };
type MockChallenge = MockEntity;

/**
 * MSW (Mock Service Worker) server for API mocking
 * Provides realistic API responses for testing
 */

// Utility helpers
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getSearchParams = (request: { url: string }) => new URL(request.url).searchParams;
const toParamString = (value: string | readonly string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

// Mock data stores
const mockFormations = new Map<string, MockFormation>();
const mockPlayers = new Map<string, MockPlayer>();
const mockChallenges = new Map<string, MockChallenge>();

// Initialize with some default data
for (let i = 0; i < 5; i++) {
  const formation = generateFormation() as unknown as MockFormation;
  mockFormations.set(formation.id, formation);

  formation.players?.forEach(player => {
    mockPlayers.set(player.id, player);
  });
}

for (let i = 0; i < 10; i++) {
  const challenge = generateChallenge() as unknown as MockChallenge;
  mockChallenges.set(challenge.id, challenge);
}

// API handlers
export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async () => {
    return HttpResponse.json(
      {
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        expiresIn: 3600,
      },
      { status: 200 }
    );
  }),

  http.post('/api/auth/logout', async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  http.get('/api/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json(
      {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
      { status: 200 }
    );
  }),

  // Formation endpoints
  http.get('/api/formations', async ({ request }) => {
    const searchParams = getSearchParams(request);
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') ?? '10', 10);
    const search = searchParams.get('search');

    let formations = Array.from(mockFormations.values());

    if (search) {
      const lowered = search.toLowerCase();
      formations = formations.filter(formation => {
        const name = typeof formation.name === 'string' ? formation.name : '';
        const description = typeof formation.description === 'string' ? formation.description : '';
        return name.toLowerCase().includes(lowered) || description.toLowerCase().includes(lowered);
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFormations = formations.slice(startIndex, endIndex);

    return HttpResponse.json(
      {
        formations: paginatedFormations,
        total: formations.length,
        page,
        limit,
        totalPages: Math.ceil(formations.length / limit),
      },
      { status: 200 }
    );
  }),

  http.get('/api/formations/:id', async ({ params }) => {
    const formationId = toParamString(params.id);
    const formation = mockFormations.get(formationId);

    if (!formation) {
      return HttpResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    return HttpResponse.json(formation, { status: 200 });
  }),

  http.post('/api/formations', async ({ request }) => {
    const formationData = (await request.json()) as Record<string, unknown>;
    const formation: MockFormation = {
      ...(generateFormation() as unknown as MockFormation),
      ...formationData,
      id: `formation-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockFormations.set(formation.id, formation);

    return HttpResponse.json(formation, { status: 201 });
  }),

  http.put('/api/formations/:id', async ({ request, params }) => {
    const formationId = toParamString(params.id);
    const existingFormation = mockFormations.get(formationId);

    if (!existingFormation) {
      return HttpResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    const updates = (await request.json()) as Record<string, unknown>;
    const updatedFormation: MockFormation = {
      ...existingFormation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockFormations.set(formationId, updatedFormation);

    return HttpResponse.json(updatedFormation, { status: 200 });
  }),

  http.delete('/api/formations/:id', async ({ params }) => {
    const formationId = toParamString(params.id);

    if (!mockFormations.has(formationId)) {
      return HttpResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    mockFormations.delete(formationId);

    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Player endpoints
  http.get('/api/players', async ({ request }) => {
    const searchParams = getSearchParams(request);
    const position = searchParams.get('position');
    const team = searchParams.get('team');

    let players = Array.from(mockPlayers.values());

    if (position) {
      players = players.filter(player => player.position === position);
    }

    if (team) {
      players = players.filter(player => player.team === team);
    }

    return HttpResponse.json(players, { status: 200 });
  }),

  http.get('/api/players/:id', async ({ params }) => {
    const playerId = toParamString(params.id);
    const player = mockPlayers.get(playerId);

    if (!player) {
      return HttpResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return HttpResponse.json(player, { status: 200 });
  }),

  http.put('/api/players/:id', async ({ request, params }) => {
    const playerId = toParamString(params.id);
    const existingPlayer = mockPlayers.get(playerId);

    if (!existingPlayer) {
      return HttpResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const updates = (await request.json()) as Record<string, unknown>;
    const updatedPlayer: MockPlayer = { ...existingPlayer, ...updates };
    mockPlayers.set(playerId, updatedPlayer);

    return HttpResponse.json(updatedPlayer, { status: 200 });
  }),

  // Challenge endpoints
  http.get('/api/challenges', async ({ request }) => {
    const searchParams = getSearchParams(request);
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const completed = searchParams.get('completed');

    let challenges = Array.from(mockChallenges.values());

    if (type) {
      challenges = challenges.filter(challenge => challenge.type === type);
    }

    if (difficulty) {
      challenges = challenges.filter(challenge => challenge.difficulty === difficulty);
    }

    if (completed !== null) {
      const shouldBeCompleted = completed === 'true';
      challenges = challenges.filter(challenge => challenge.isCompleted === shouldBeCompleted);
    }

    return HttpResponse.json(challenges, { status: 200 });
  }),

  http.get('/api/challenges/:id', async ({ params }) => {
    const challengeId = toParamString(params.id);
    const challenge = mockChallenges.get(challengeId);

    if (!challenge) {
      return HttpResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return HttpResponse.json(challenge, { status: 200 });
  }),

  http.post('/api/challenges/:id/complete', async ({ params }) => {
    const challengeId = toParamString(params.id);
    const challenge = mockChallenges.get(challengeId);

    if (!challenge) {
      return HttpResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const completedChallenge: MockChallenge = {
      ...challenge,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      progress: 100,
    };

    mockChallenges.set(challengeId, completedChallenge);

    return HttpResponse.json(completedChallenge, { status: 200 });
  }),

  // Analytics endpoints
  http.get('/api/analytics/formation/:id', async ({ params }) => {
    const formationId = toParamString(params.id);
    const formation = mockFormations.get(formationId);

    if (!formation) {
      return HttpResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    const analytics = generateAnalyticsData();
    return HttpResponse.json(analytics, { status: 200 });
  }),

  http.get('/api/analytics/heatmap/:playerId', async ({ params }) => {
    const playerId = toParamString(params.playerId);
    const player = mockPlayers.get(playerId);

    if (!player) {
      return HttpResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const heatMapData = generateHeatMapData([player as any]);
    return HttpResponse.json(heatMapData, { status: 200 });
  }),

  // Collaboration endpoints
  http.get('/api/collaboration/sessions', async () => {
    const sessions = Array.from({ length: 3 }, () => generateCollaborationSession());
    return HttpResponse.json(sessions, { status: 200 });
  }),

  http.post('/api/collaboration/sessions', async ({ request }) => {
    const sessionData = (await request.json()) as Record<string, unknown>;
    const session = {
      ...generateCollaborationSession(),
      ...sessionData,
      id: `session-${Date.now()}`,
    };

    return HttpResponse.json(session, { status: 201 });
  }),

  // Export/Import endpoints
  http.post('/api/export/formation/:id', async ({ request, params }) => {
    const formationId = toParamString(params.id);
    const formation = mockFormations.get(formationId);

    if (!formation) {
      return HttpResponse.json({ error: 'Formation not found' }, { status: 404 });
    }

    const { format } = (await request.json()) as { format: string };

    await sleep(1000);

    const exportData = {
      url: `https://example.com/exports/${formationId}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return HttpResponse.json(exportData, { status: 200 });
  }),

  http.post('/api/import/formation', async ({ request }) => {
    const formData = (await request.json()) as Record<string, unknown> & { name?: string };

    await sleep(2000);

    const baseFormation = generateFormation() as unknown as MockFormation;
    const importedFormation: MockFormation = {
      ...baseFormation,
      name: `Imported ${formData.name ?? 'Formation'}`,
      description: 'Imported formation',
    };

    mockFormations.set(importedFormation.id, importedFormation);

    return HttpResponse.json(importedFormation, { status: 201 });
  }),

  // Error simulation endpoints
  http.get('/api/test/error/:statusCode', async ({ params }) => {
    const statusCode = Number.parseInt(toParamString(params.statusCode) || '500', 10);

    return HttpResponse.json(
      { error: `Test error with status ${statusCode}` },
      { status: statusCode }
    );
  }),

  http.get('/api/test/timeout', () => {
    return new Promise<never>(() => {});
  }),

  http.get('/api/test/slow', async () => {
    await sleep(5000);
    return HttpResponse.json({ message: 'Slow response' }, { status: 200 });
  }),

  // WebSocket simulation
  http.get('/api/ws/collaboration/:sessionId', async ({ params }) => {
    return HttpResponse.json(
      {
        url: `ws://localhost:3001/collaboration/${toParamString(params.sessionId)}`,
        token: 'mock-ws-token',
      },
      { status: 200 }
    );
  }),
];

// Create and configure the server
export const server = setupServer(...handlers);

// Server utilities for tests
export const serverUtils = {
  addHandlers: (...customHandlers: Parameters<typeof server.use>) => {
    server.use(...customHandlers);
  },

  resetHandlers: () => {
    server.resetHandlers(...handlers);
  },

  simulateNetworkError: (path: string) => {
    server.use(
      http.get(path, async () => {
        return HttpResponse.error();
      })
    );
  },

  simulateServerError: (path: string, statusCode = 500) => {
    server.use(
      http.get(path, async () => {
        return HttpResponse.json({ error: 'Server error' }, { status: statusCode });
      })
    );
  },

  simulateSlowResponse: (path: string, delay = 3000) => {
    server.use(
      http.get(path, async () => {
        await sleep(delay);
        return HttpResponse.json({ message: 'Delayed response' }, { status: 200 });
      })
    );
  },

  addFormation: (formation: MockFormation) => {
    mockFormations.set(formation.id, formation);
  },

  addPlayer: (player: MockPlayer) => {
    mockPlayers.set(player.id, player);
  },

  addChallenge: (challenge: MockChallenge) => {
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
