import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API endpoint for player ranking data
 * GET /api/player-ranking/:playerId
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerId } = req.query;

    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json({ error: 'Invalid player ID' });
    }

    // Mock player ranking data
    // In production, this would fetch from a database
    const playerRanking = {
      id: playerId,
      rank: Math.floor(Math.random() * 1000) + 1,
      rating: (Math.random() * 40 + 60).toFixed(1),
      stats: {
        gamesPlayed: Math.floor(Math.random() * 100) + 10,
        wins: Math.floor(Math.random() * 60) + 5,
        draws: Math.floor(Math.random() * 20),
        losses: Math.floor(Math.random() * 20),
        goalsScored: Math.floor(Math.random() * 100) + 10,
        goalsConceded: Math.floor(Math.random() * 80) + 5,
      },
      performance: {
        attacking: (Math.random() * 30 + 70).toFixed(1),
        defending: (Math.random() * 30 + 70).toFixed(1),
        passing: (Math.random() * 30 + 70).toFixed(1),
        physical: (Math.random() * 30 + 70).toFixed(1),
      },
      recentForm: Array.from({ length: 5 }, () =>
        ['W', 'D', 'L'][Math.floor(Math.random() * 3)],
      ),
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json(playerRanking);
  } catch (error) {
    // Log error for debugging
    if (error instanceof Error) {
      // Production logging would go here
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
