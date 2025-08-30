import { http, HttpResponse } from 'msw';

// Define API base URL
const API_BASE_URL = 'https://api.example.com';

// Mock API handlers for external services
export const handlers = [
  // Mock authentication endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        id: 'user1',
        email: 'test@example.com',
        role: 'coach',
        firstName: 'Test',
        lastName: 'User',
        token: 'mock-jwt-token'
      });
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Mock AI service endpoints
  http.post(`${API_BASE_URL}/ai/chat`, async ({ request }) => {
    const { prompt } = await request.json() as any;
    
    return HttpResponse.json({
      response: `Mock AI response to: ${prompt}`,
      confidence: 0.95,
      timestamp: new Date().toISOString()
    });
  }),

  // Mock tactical analysis endpoint
  http.post(`${API_BASE_URL}/ai/tactics`, async ({ request }) => {
    const { formation, players } = await request.json() as any;
    
    return HttpResponse.json({
      analysis: 'Mock tactical analysis',
      strengths: ['Strong midfield', 'Good attacking options'],
      weaknesses: ['Weak defense', 'Lack of pace on wings'],
      suggestions: ['Consider 4-3-3 formation', 'Add defensive midfielder']
    });
  }),

  // Mock player data endpoints
  http.get(`${API_BASE_URL}/players`, () => {
    return HttpResponse.json([
      {
        id: 'player1',
        name: 'Test Player',
        position: 'MF',
        attributes: {
          speed: 80,
          passing: 85,
          tackling: 70,
          shooting: 75,
          dribbling: 80,
          positioning: 85,
          stamina: 90
        }
      }
    ]);
  }),

  // Mock formation endpoints
  http.get(`${API_BASE_URL}/formations`, () => {
    return HttpResponse.json([
      {
        id: 'formation1',
        name: '4-4-2',
        positions: [
          { x: 50, y: 10, role: 'GK' },
          { x: 20, y: 30, role: 'DF' },
          { x: 40, y: 30, role: 'DF' },
          { x: 60, y: 30, role: 'DF' },
          { x: 80, y: 30, role: 'DF' },
          { x: 20, y: 60, role: 'MF' },
          { x: 40, y: 60, role: 'MF' },
          { x: 60, y: 60, role: 'MF' },
          { x: 80, y: 60, role: 'MF' },
          { x: 30, y: 85, role: 'FW' },
          { x: 70, y: 85, role: 'FW' }
        ]
      }
    ]);
  }),

  // Mock file upload endpoint
  http.post(`${API_BASE_URL}/upload`, () => {
    return HttpResponse.json({
      url: 'https://example.com/uploaded-file.jpg',
      filename: 'test-file.jpg'
    });
  }),

  // Catch-all handler for unhandled requests
  http.get('*', ({ request }) => {
    console.warn(`Unhandled GET request: ${request.url}`);
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),

  http.post('*', ({ request }) => {
    console.warn(`Unhandled POST request: ${request.url}`);
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.post(`${API_BASE_URL}/ai/chat`, () => {
    return HttpResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }),
];

export { API_BASE_URL };