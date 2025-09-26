import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tacticalIntegrationService } from '../../services/tacticalIntegrationService';
import { aiCoachingService } from '../../services/aiCoachingService';
import { type Formation, type Player } from '../../types';

// Mock OpenAI service for consistent testing
vi.mock('../../services/openAiService', () => ({
  openAiService: {
    generateContent: vi.fn().mockResolvedValue('{"recommendations": [{"title": "Improve Midfield Balance", "description": "Your midfield lacks width and could benefit from wider positioning", "reasoning": "Width in midfield creates more passing options and stretches the opposition", "priority": "medium", "confidence": 78, "impact": "moderate"}]}')
  }
}));

describe('Tactical Features Functional Tests', () => {
  const testFormation: Formation = {
    id: 'test-433',
    name: '4-3-3',
    positions: {
      'gk1': { x: 50, y: 5 },    // Goalkeeper
      'cb1': { x: 35, y: 20 },   // Center Back 1
      'cb2': { x: 65, y: 20 },   // Center Back 2
      'lb1': { x: 15, y: 25 },   // Left Back
      'rb1': { x: 85, y: 25 },   // Right Back
      'dm1': { x: 50, y: 40 },   // Defensive Mid
      'cm1': { x: 35, y: 55 },   // Center Mid 1
      'cm2': { x: 65, y: 55 },   // Center Mid 2
      'lw1': { x: 20, y: 75 },   // Left Wing
      'rw1': { x: 80, y: 75 },   // Right Wing
      'st1': { x: 50, y: 85 }    // Striker
    }
  };

  const testPlayers: Player[] = [
    { id: 'gk1', name: 'Test Keeper', position: 'GK', currentPotential: 85, age: 28 },
    { id: 'cb1', name: 'Test CB1', position: 'CB', currentPotential: 82, age: 25 },
    { id: 'cb2', name: 'Test CB2', position: 'CB', currentPotential: 80, age: 27 },
    { id: 'lb1', name: 'Test LB', position: 'LB', currentPotential: 78, age: 24 },
    { id: 'rb1', name: 'Test RB', position: 'RB', currentPotential: 76, age: 26 },
    { id: 'dm1', name: 'Test DM', position: 'DM', currentPotential: 84, age: 25 },
    { id: 'cm1', name: 'Test CM1', position: 'CM', currentPotential: 83, age: 23 },
    { id: 'cm2', name: 'Test CM2', position: 'CM', currentPotential: 81, age: 24 },
    { id: 'lw1', name: 'Test LW', position: 'LW', currentPotential: 86, age: 22 },
    { id: 'rw1', name: 'Test RW', position: 'RW', currentPotential: 85, age: 23 },
    { id: 'st1', name: 'Test ST', position: 'ST', currentPotential: 90, age: 25 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Formation Analysis Integration', () => {
    it('should analyze formation effectiveness correctly', async () => {
      const analysis = await tacticalIntegrationService.analyzeFormation(testFormation, testPlayers);

      expect(analysis).toBeDefined();
      expect(analysis.effectiveness).toBeGreaterThanOrEqual(0);
      expect(analysis.effectiveness).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.strengths)).toBe(true);
      expect(Array.isArray(analysis.weaknesses)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(['low', 'medium', 'high']).toContain(analysis.riskLevel);
    });

    it('should calculate player chemistry properly', () => {
      const chemistry = tacticalIntegrationService.calculatePlayerChemistry(testPlayers, testFormation);

      expect(chemistry.overall).toBeGreaterThanOrEqual(0);
      expect(chemistry.overall).toBeLessThanOrEqual(100);
      expect(typeof chemistry.individual).toBe('object');
      expect(Array.isArray(chemistry.suggestions)).toBe(true);

      // Check individual chemistry scores
      testPlayers.forEach(player => {
        if (chemistry.individual[player.id] !== undefined) {
          expect(chemistry.individual[player.id]).toBeGreaterThanOrEqual(0);
          expect(chemistry.individual[player.id]).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should generate heat map data', () => {
      const heatMap = tacticalIntegrationService.generateHeatMapData(testFormation, testPlayers);

      expect(heatMap.zones).toBeDefined();
      expect(Array.isArray(heatMap.zones)).toBe(true);
      expect(heatMap.coverage).toBeGreaterThanOrEqual(0);
      expect(heatMap.coverage).toBeLessThanOrEqual(100);

      // Validate zone data
      heatMap.zones.forEach(zone => {
        expect(zone.x).toBeGreaterThanOrEqual(0);
        expect(zone.x).toBeLessThanOrEqual(100);
        expect(zone.y).toBeGreaterThanOrEqual(0);
        expect(zone.y).toBeLessThanOrEqual(100);
        expect(zone.intensity).toBeGreaterThanOrEqual(0);
        expect(zone.intensity).toBeLessThanOrEqual(1);
        expect(['attack', 'defense', 'midfield']).toContain(zone.type);
      });
    });
  });

  describe('2. AI Coaching Recommendations', () => {
    it('should generate comprehensive coaching recommendations', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(
        testFormation,
        testPlayers
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Validate recommendation structure
      recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.reasoning).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
        expect(['low', 'medium', 'high', 'critical']).toContain(rec.priority);
        expect(['minor', 'moderate', 'significant', 'game-changing']).toContain(rec.impact);
        expect(['formation', 'player', 'tactical', 'strategy', 'substitution']).toContain(rec.type);
      });
    });

    it('should provide contextual advice for different game situations', async () => {
      // Test losing scenario
      const losingRecommendations = await aiCoachingService.generateCoachingRecommendations(
        testFormation,
        testPlayers,
        { gamePhase: 'late', score: { home: 0, away: 1 }, gameState: 'losing' }
      );

      expect(losingRecommendations.length).toBeGreaterThan(0);

      // Test winning scenario
      const winningRecommendations = await aiCoachingService.generateCoachingRecommendations(
        testFormation,
        testPlayers,
        { gamePhase: 'late', score: { home: 2, away: 1 }, gameState: 'winning' }
      );

      expect(winningRecommendations.length).toBeGreaterThan(0);

      // Recommendations should be different for different contexts
      const losingTitles = losingRecommendations.map(r => r.title);
      const winningTitles = winningRecommendations.map(r => r.title);
      
      // At least some recommendations should be different
      const commonTitles = losingTitles.filter(title => winningTitles.includes(title));
      expect(commonTitles.length).toBeLessThan(Math.max(losingTitles.length, winningTitles.length));
    });

    it('should store and retrieve coaching history', () => {
      const testRec = {
        id: 'test-history',
        type: 'tactical' as const,
        title: 'Test Historical Recommendation',
        description: 'This is a test',
        reasoning: 'For testing purposes',
        confidence: 90,
        priority: 'high' as const,
        impact: 'significant' as const
      };

      const initialHistoryLength = aiCoachingService.getCoachingHistory().length;
      
      aiCoachingService.storeRecommendation(testRec);
      
      const newHistory = aiCoachingService.getCoachingHistory();
      expect(newHistory.length).toBe(initialHistoryLength + 1);
      
      const storedRec = newHistory.find(r => r.title === 'Test Historical Recommendation');
      expect(storedRec).toBeDefined();
      expect(storedRec?.confidence).toBe(90);
    });
  });

  describe('3. Match Simulation Integration', () => {
    it('should create proper simulation configuration', () => {
      const config = tacticalIntegrationService.createSimulationConfig(
        testFormation,
        testPlayers,
        { playStyle: 'attacking', tempo: 'fast', aggression: 80 }
      );

      expect(config.formation).toEqual(testFormation);
      expect(config.players).toEqual(testPlayers);
      expect(config.tactics.playStyle).toBe('attacking');
      expect(config.tactics.tempo).toBe('fast');
      expect(config.tactics.aggression).toBe(80);
    });

    it('should use default tactics when not specified', () => {
      const config = tacticalIntegrationService.createSimulationConfig(testFormation, testPlayers);

      expect(config.tactics.playStyle).toBe('balanced');
      expect(config.tactics.tempo).toBe('medium');
      expect(config.tactics.aggression).toBe(50);
    });

    it('should calculate formation matchups', () => {
      const opponentFormation: Formation = {
        id: 'opponent-442',
        name: '4-4-2',
        positions: {
          'opp-gk': { x: 50, y: 95 },
          'opp-cb1': { x: 35, y: 80 },
          'opp-cb2': { x: 65, y: 80 },
          'opp-lb': { x: 15, y: 75 },
          'opp-rb': { x: 85, y: 75 },
          'opp-lm': { x: 25, y: 55 },
          'opp-rm': { x: 75, y: 55 },
          'opp-cm1': { x: 40, y: 45 },
          'opp-cm2': { x: 60, y: 45 },
          'opp-st1': { x: 40, y: 15 },
          'opp-st2': { x: 60, y: 15 }
        }
      };

      const matchup = tacticalIntegrationService.calculateMatchup(testFormation, opponentFormation);

      expect(matchup.homeAdvantage).toBeGreaterThanOrEqual(0);
      expect(matchup.homeAdvantage).toBeLessThanOrEqual(100);
      expect(matchup.awayAdvantage).toBeGreaterThanOrEqual(0);
      expect(matchup.awayAdvantage).toBeLessThanOrEqual(100);
      expect(Array.isArray(matchup.keyBattles)).toBe(true);
      expect(Array.isArray(matchup.predictions)).toBe(true);
    });
  });

  describe('4. Formation Export/Import', () => {
    it('should export formation with complete data', async () => {
      const analysis = await tacticalIntegrationService.analyzeFormation(testFormation, testPlayers);
      const exportData = tacticalIntegrationService.exportFormation(testFormation, testPlayers, analysis);

      expect(exportData.id).toBeDefined();
      expect(exportData.name).toBe(testFormation.name);
      expect(exportData.formation).toEqual(testFormation);
      expect(exportData.players).toEqual(testPlayers);
      expect(exportData.analysis).toEqual(analysis);
      expect(exportData.timestamp).toBeDefined();
      expect(typeof exportData.timestamp).toBe('number');
    });

    it('should export formation without analysis (fallback)', () => {
      const exportData = tacticalIntegrationService.exportFormation(testFormation, testPlayers);

      expect(exportData.formation).toEqual(testFormation);
      expect(exportData.players).toEqual(testPlayers);
      expect(exportData.analysis).toBeDefined();
      expect(exportData.analysis.effectiveness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Error Handling and Edge Cases', () => {
    it('should handle empty formations gracefully', async () => {
      const emptyFormation: Formation = {
        id: 'empty',
        name: 'Empty Formation',
        positions: {}
      };

      const analysis = await tacticalIntegrationService.analyzeFormation(emptyFormation, []);
      expect(analysis).toBeDefined();
      expect(analysis.effectiveness).toBeGreaterThanOrEqual(0);

      const chemistry = tacticalIntegrationService.calculatePlayerChemistry([], emptyFormation);
      expect(chemistry).toBeDefined();

      const heatMap = tacticalIntegrationService.generateHeatMapData(emptyFormation, []);
      expect(heatMap.zones).toEqual([]);
    });

    it('should handle malformed position data', () => {
      const malformedFormation: Formation = {
        id: 'malformed',
        name: 'Malformed',
        positions: {
          'player1': { x: -10, y: 120 }, // Invalid coordinates
          'player2': { x: 150, y: -5 }   // Invalid coordinates
        }
      };

      const chemistry = tacticalIntegrationService.calculatePlayerChemistry(testPlayers, malformedFormation);
      expect(chemistry).toBeDefined();
      expect(chemistry.overall).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing player data', async () => {
      const recommendations = await aiCoachingService.generateCoachingRecommendations(testFormation, []);
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('6. Performance and Optimization', () => {
    it('should handle large formations efficiently', async () => {
      // Create a formation with many positions
      const largeFormation: Formation = {
        id: 'large',
        name: 'Large Formation',
        positions: {}
      };

      const largePlayers: Player[] = [];

      // Add 20 players (more than typical 11)
      for (let i = 1; i <= 20; i++) {
        const playerId = `player${i}`;
        largeFormation.positions[playerId] = {
          x: Math.random() * 100,
          y: Math.random() * 100
        };
        largePlayers.push({
          id: playerId,
          name: `Player ${i}`,
          position: 'CM',
          currentPotential: 70 + Math.random() * 20,
          age: 20 + Math.random() * 10
        });
      }

      const startTime = Date.now();
      
      const analysis = await tacticalIntegrationService.analyzeFormation(largeFormation, largePlayers);
      const chemistry = tacticalIntegrationService.calculatePlayerChemistry(largePlayers, largeFormation);
      const heatMap = tacticalIntegrationService.generateHeatMapData(largeFormation, largePlayers);
      const recommendations = await aiCoachingService.generateCoachingRecommendations(largeFormation, largePlayers);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      
      // All results should be valid
      expect(analysis).toBeDefined();
      expect(chemistry).toBeDefined();
      expect(heatMap).toBeDefined();
      expect(recommendations).toBeDefined();
    });
  });

  describe('7. Data Consistency and Validation', () => {
    it('should maintain consistent data across multiple operations', async () => {
      // Perform multiple operations and ensure they return consistent results
      const analysis1 = await tacticalIntegrationService.analyzeFormation(testFormation, testPlayers);
      const analysis2 = await tacticalIntegrationService.analyzeFormation(testFormation, testPlayers);

      // Same formation should produce similar results (allowing for minor variations)
      expect(Math.abs(analysis1.effectiveness - analysis2.effectiveness)).toBeLessThan(10);

      const chemistry1 = tacticalIntegrationService.calculatePlayerChemistry(testPlayers, testFormation);
      const chemistry2 = tacticalIntegrationService.calculatePlayerChemistry(testPlayers, testFormation);

      // Chemistry should be deterministic for same inputs
      expect(chemistry1.overall).toBe(chemistry2.overall);
    });

    it('should validate formation position ranges', () => {
      const positions = Object.values(testFormation.positions);
      
      positions.forEach(position => {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(100);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThanOrEqual(100);
      });
    });

    it('should validate player data integrity', () => {
      testPlayers.forEach(player => {
        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.currentPotential).toBeGreaterThanOrEqual(0);
        expect(player.currentPotential).toBeLessThanOrEqual(100);
        expect(player.age).toBeGreaterThan(0);
        expect(player.age).toBeLessThan(50);
      });
    });
  });
});

describe('Integration Verification Summary', () => {
  it('should confirm all tactical features are functional', async () => {
    const testFormation: Formation = {
      id: 'verification',
      name: 'Verification Formation',
      positions: {
        'p1': { x: 50, y: 85 },
        'p2': { x: 30, y: 60 },
        'p3': { x: 70, y: 60 },
        'p4': { x: 50, y: 30 }
      }
    };

    const testPlayers: Player[] = [
      { id: 'p1', name: 'Striker', position: 'ST', currentPotential: 85, age: 25 },
      { id: 'p2', name: 'Left Mid', position: 'LM', currentPotential: 80, age: 24 },
      { id: 'p3', name: 'Right Mid', position: 'RM', currentPotential: 82, age: 23 },
      { id: 'p4', name: 'Center Back', position: 'CB', currentPotential: 78, age: 27 }
    ];

    // Test all major features
    const results = await Promise.all([
      tacticalIntegrationService.analyzeFormation(testFormation, testPlayers),
      aiCoachingService.generateCoachingRecommendations(testFormation, testPlayers)
    ]);

    const [analysis, recommendations] = results;
    const chemistry = tacticalIntegrationService.calculatePlayerChemistry(testPlayers, testFormation);
    const heatMap = tacticalIntegrationService.generateHeatMapData(testFormation, testPlayers);
    const exportData = tacticalIntegrationService.exportFormation(testFormation, testPlayers, analysis);
    const simulationConfig = tacticalIntegrationService.createSimulationConfig(testFormation, testPlayers);

    // Verify all features produced valid results
    expect(analysis.effectiveness).toBeGreaterThan(0);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(chemistry.overall).toBeGreaterThan(0);
    expect(heatMap.zones.length).toBeGreaterThan(0);
    expect(exportData.id).toBeDefined();
    expect(simulationConfig.formation).toEqual(testFormation);

    console.log('✅ All tactical features verified successfully!');
    console.log(`Formation Analysis: ${analysis.effectiveness}% effective`);
    console.log(`AI Recommendations: ${recommendations.length} generated`);
    console.log(`Player Chemistry: ${chemistry.overall}% overall`);
    console.log(`Heat Map Zones: ${heatMap.zones.length} zones`);
    console.log(`Export Data: Complete with ID ${exportData.id}`);
  });
});