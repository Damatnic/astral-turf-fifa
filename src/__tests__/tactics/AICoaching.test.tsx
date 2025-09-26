import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiCoachingService } from '../../services/aiCoachingService';
import { type Formation, type Player } from '../../types';

// Mock OpenAI service
vi.mock('../../services/openAiService', () => ({
  openAiService: {
    generateContent: vi.fn().mockResolvedValue('{"recommendations": [{"title": "Test Recommendation", "description": "Test description", "reasoning": "Test reasoning", "priority": "high", "confidence": 85, "impact": "significant"}]}')
  }
}));

// Mock tactical integration service
vi.mock('../../services/tacticalIntegrationService', () => ({
  tacticalIntegrationService: {
    analyzeFormation: vi.fn().mockResolvedValue({
      effectiveness: 85,
      riskLevel: 'medium',
      strengths: ['Good balance'],
      weaknesses: ['Could improve width']
    })
  }
}));

describe('AI Coaching Service', () => {
  const mockFormation: Formation = {
    id: 'test-formation',
    name: '4-3-3',
    positions: {
      '1': { x: 50, y: 85 }, // Striker
      '2': { x: 30, y: 60 }, // Left Mid
      '3': { x: 70, y: 60 }, // Right Mid
      '4': { x: 50, y: 50 }, // Center Mid
      '5': { x: 20, y: 30 }, // Left Back
      '6': { x: 80, y: 30 }, // Right Back
      '7': { x: 50, y: 20 }  // Center Back
    }
  };

  const mockPlayers: Player[] = [
    { id: '1', name: 'Striker', position: 'CF', currentPotential: 90, age: 25 },
    { id: '2', name: 'Left Mid', position: 'LM', currentPotential: 85, age: 23 },
    { id: '3', name: 'Right Mid', position: 'RM', currentPotential: 82, age: 24 },
    { id: '4', name: 'Center Mid', position: 'CM', currentPotential: 88, age: 26 },
    { id: '5', name: 'Left Back', position: 'LB', currentPotential: 75, age: 28 },
    { id: '6', name: 'Right Back', position: 'RB', currentPotential: 77, age: 27 },
    { id: '7', name: 'Center Back', position: 'CB', currentPotential: 80, age: 29 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coaching Recommendations Generation', () => {
    it('should generate comprehensive coaching recommendations', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include different types of recommendations', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      const types = recommendations.map(r => r.type);
      
      // Should have a variety of recommendation types
      expect(types.some(t => ['formation', 'player', 'tactical', 'strategy'].includes(t))).toBe(true);
    });

    it('should prioritize recommendations correctly', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      // Should be sorted by priority (critical > high > medium > low)
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        expect(priorityOrder[current.priority]).toBeGreaterThanOrEqual(priorityOrder[next.priority]);
      }
    });

    it('should include confidence scores', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      recommendations.forEach(recommendation => {
        expect(recommendation.confidence).toBeDefined();
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should include impact assessments', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      recommendations.forEach(recommendation => {
        expect(recommendation.impact).toBeDefined();
        expect(['game-changing', 'significant', 'moderate', 'minor']).toContain(recommendation.impact);
      });
    });
  });

  describe('Formation Structure Analysis', () => {
    it('should detect formation imbalances', async () => {
      // Create an imbalanced formation (all players on one side)
      const imbalancedFormation: Formation = {
        id: 'imbalanced',
        name: 'Imbalanced',
        positions: {
          '1': { x: 20, y: 80 },
          '2': { x: 25, y: 60 },
          '3': { x: 30, y: 40 },
          '4': { x: 35, y: 20 }
        }
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        imbalancedFormation,
        mockPlayers.slice(0, 4)
      );

      // Should include recommendations about balance
      const balanceRecommendations = recommendations.filter(r => 
        r.title.toLowerCase().includes('balance') || 
        r.description.toLowerCase().includes('balance')
      );

      expect(balanceRecommendations.length).toBeGreaterThan(0);
    });

    it('should detect formation compactness issues', async () => {
      // Create a very spread out formation
      const spreadFormation: Formation = {
        id: 'spread',
        name: 'Spread',
        positions: {
          '1': { x: 50, y: 95 },
          '2': { x: 50, y: 70 },
          '3': { x: 50, y: 40 },
          '4': { x: 50, y: 5 }
        }
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        spreadFormation,
        mockPlayers.slice(0, 4)
      );

      // Should include recommendations about compactness
      const compactnessRecommendations = recommendations.filter(r => 
        r.title.toLowerCase().includes('compact') || 
        r.description.toLowerCase().includes('compact') ||
        r.description.toLowerCase().includes('spread')
      );

      expect(compactnessRecommendations.length).toBeGreaterThan(0);
    });

    it('should detect width utilization issues', async () => {
      // Create a narrow formation
      const narrowFormation: Formation = {
        id: 'narrow',
        name: 'Narrow',
        positions: {
          '1': { x: 45, y: 80 },
          '2': { x: 50, y: 60 },
          '3': { x: 55, y: 40 },
          '4': { x: 50, y: 20 }
        }
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        narrowFormation,
        mockPlayers.slice(0, 4)
      );

      // Should include recommendations about width
      const widthRecommendations = recommendations.filter(r => 
        r.title.toLowerCase().includes('width') || 
        r.description.toLowerCase().includes('width') ||
        r.description.toLowerCase().includes('narrow')
      );

      expect(widthRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Player Position Analysis', () => {
    it('should identify poorly positioned players', async () => {
      // Create a formation with a player in wrong position
      const wrongPositionPlayers: Player[] = [
        { id: '1', name: 'Goalkeeper', position: 'GK', currentPotential: 85, age: 25 }
      ];

      const wrongPositionFormation: Formation = {
        id: 'wrong',
        name: 'Wrong Position',
        positions: {
          '1': { x: 50, y: 90 } // Goalkeeper positioned as striker
        }
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        wrongPositionFormation,
        wrongPositionPlayers
      );

      // Should include player positioning recommendations
      const positioningRecommendations = recommendations.filter(r => 
        r.type === 'player' || 
        r.description.toLowerCase().includes('position')
      );

      expect(positioningRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Contextual Tactical Advice', () => {
    it('should provide different advice based on game phase', async () => {
      const lateGameContext = {
        gamePhase: 'late',
        score: { home: 0, away: 1 },
        gameState: 'losing'
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers,
        lateGameContext
      );

      // Should include attacking recommendations when losing late
      const attackingRecommendations = recommendations.filter(r => 
        r.description.toLowerCase().includes('attack') || 
        r.description.toLowerCase().includes('forward') ||
        r.description.toLowerCase().includes('urgent')
      );

      expect(attackingRecommendations.length).toBeGreaterThan(0);
    });

    it('should provide defensive advice when winning', async () => {
      const winningContext = {
        gamePhase: 'late',
        score: { home: 2, away: 1 },
        gameState: 'winning'
      };

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers,
        winningContext
      );

      // Should include defensive recommendations when winning
      const defensiveRecommendations = recommendations.filter(r => 
        r.description.toLowerCase().includes('defensive') || 
        r.description.toLowerCase().includes('protect') ||
        r.description.toLowerCase().includes('lead')
      );

      expect(defensiveRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Storage', () => {
    it('should store recommendations in history', () => {
      const testRecommendation = {
        id: 'test-rec',
        type: 'tactical' as const,
        title: 'Test Recommendation',
        description: 'Test description',
        reasoning: 'Test reasoning',
        confidence: 85,
        priority: 'high' as const,
        impact: 'significant' as const
      };

      aiCoachingService.storeRecommendation(testRecommendation);
      
      const history = aiCoachingService.getCoachingHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const storedRec = history.find(r => r.title === 'Test Recommendation');
      expect(storedRec).toBeDefined();
      expect(storedRec?.confidence).toBe(85);
    });

    it('should limit history size', () => {
      // Store more than 50 recommendations
      for (let i = 0; i < 55; i++) {
        aiCoachingService.storeRecommendation({
          id: `test-rec-${i}`,
          type: 'tactical',
          title: `Test Recommendation ${i}`,
          description: 'Test description',
          reasoning: 'Test reasoning',
          confidence: 85,
          priority: 'medium',
          impact: 'moderate'
        });
      }

      const history = aiCoachingService.getCoachingHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing formation gracefully', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        undefined as any,
        mockPlayers
      );

      // Should return fallback recommendations
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle empty player list', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        []
      );

      // Should return fallback recommendations
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle AI service failures', async () => {
      // Mock AI service failure
      const { openAiService } = await import('../../services/openAiService');
      vi.mocked(openAiService.generateContent).mockRejectedValueOnce(new Error('AI service unavailable'));

      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        mockFormation,
        mockPlayers
      );

      // Should still return recommendations (fallback)
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});