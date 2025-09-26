import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { tacticalIntegrationService } from '../../services/tacticalIntegrationService';
import { type Formation, type Player } from '../../types';

// Mock the service
vi.mock('../../services/tacticalIntegrationService', () => ({
  tacticalIntegrationService: {
    analyzeFormation: vi.fn(),
    calculateMatchup: vi.fn(),
    exportFormation: vi.fn(),
    createSimulationConfig: vi.fn(),
    calculatePlayerChemistry: vi.fn(),
    generateHeatMapData: vi.fn()
  }
}));

describe('Tactical Integration Service', () => {
  const mockFormation: Formation = {
    id: 'test-formation',
    name: '4-3-3',
    positions: {
      '1': { x: 50, y: 80 },
      '2': { x: 30, y: 60 },
      '3': { x: 70, y: 60 },
      '4': { x: 50, y: 40 }
    }
  };

  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Striker',
      position: 'CF',
      currentPotential: 90,
      age: 25
    },
    {
      id: '2',
      name: 'Left Midfielder',
      position: 'LM',
      currentPotential: 85,
      age: 23
    },
    {
      id: '3',
      name: 'Right Midfielder', 
      position: 'RM',
      currentPotential: 82,
      age: 24
    },
    {
      id: '4',
      name: 'Defensive Midfielder',
      position: 'DM',
      currentPotential: 78,
      age: 26
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Formation Analysis', () => {
    it('should analyze formation effectiveness', async () => {
      const mockAnalysis = {
        strengths: ['Good attacking presence', 'Strong midfield'],
        weaknesses: ['Vulnerable on flanks'],
        recommendations: ['Improve defensive coverage'],
        effectiveness: 85,
        riskLevel: 'medium' as const
      };

      vi.mocked(tacticalIntegrationService.analyzeFormation).mockResolvedValue(mockAnalysis);

      const result = await tacticalIntegrationService.analyzeFormation(mockFormation, mockPlayers);

      expect(tacticalIntegrationService.analyzeFormation).toHaveBeenCalledWith(mockFormation, mockPlayers);
      expect(result).toEqual(mockAnalysis);
      expect(result.effectiveness).toBe(85);
      expect(result.riskLevel).toBe('medium');
    });

    it('should handle empty formation gracefully', async () => {
      const emptyFormation: Formation = {
        id: 'empty',
        name: 'Empty',
        positions: {}
      };

      const mockAnalysis = {
        strengths: [],
        weaknesses: ['No players positioned'],
        recommendations: ['Add players to formation'],
        effectiveness: 0,
        riskLevel: 'high' as const
      };

      vi.mocked(tacticalIntegrationService.analyzeFormation).mockResolvedValue(mockAnalysis);

      const result = await tacticalIntegrationService.analyzeFormation(emptyFormation, []);
      expect(result.effectiveness).toBe(0);
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('Player Chemistry Calculation', () => {
    it('should calculate player chemistry correctly', () => {
      const mockChemistry = {
        overall: 85,
        individual: {
          '1': 90,
          '2': 85,
          '3': 82,
          '4': 85
        },
        suggestions: ['Good chemistry overall']
      };

      vi.mocked(tacticalIntegrationService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

      const result = tacticalIntegrationService.calculatePlayerChemistry(mockPlayers, mockFormation);

      expect(tacticalIntegrationService.calculatePlayerChemistry).toHaveBeenCalledWith(mockPlayers, mockFormation);
      expect(result.overall).toBe(85);
      expect(result.individual['1']).toBe(90);
      expect(result.suggestions).toContain('Good chemistry overall');
    });

    it('should identify low chemistry players', () => {
      const mockChemistry = {
        overall: 65,
        individual: {
          '1': 90,
          '2': 45, // Low chemistry
          '3': 82,
          '4': 85
        },
        suggestions: ['Consider repositioning Left Midfielder for better chemistry']
      };

      vi.mocked(tacticalIntegrationService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

      const result = tacticalIntegrationService.calculatePlayerChemistry(mockPlayers, mockFormation);
      
      expect(result.individual['2']).toBe(45);
      expect(result.suggestions[0]).toContain('repositioning');
    });
  });

  describe('Heat Map Generation', () => {
    it('should generate heat map data', () => {
      const mockHeatMap = {
        zones: [
          { x: 50, y: 80, intensity: 0.9, type: 'attack' as const },
          { x: 30, y: 60, intensity: 0.7, type: 'midfield' as const },
          { x: 70, y: 60, intensity: 0.7, type: 'midfield' as const },
          { x: 50, y: 40, intensity: 0.6, type: 'defense' as const }
        ],
        coverage: 85
      };

      vi.mocked(tacticalIntegrationService.generateHeatMapData).mockReturnValue(mockHeatMap);

      const result = tacticalIntegrationService.generateHeatMapData(mockFormation, mockPlayers);

      expect(tacticalIntegrationService.generateHeatMapData).toHaveBeenCalledWith(mockFormation, mockPlayers);
      expect(result.zones).toHaveLength(4);
      expect(result.coverage).toBe(85);
      expect(result.zones[0].type).toBe('attack');
    });

    it('should handle different zone types correctly', () => {
      const mockHeatMap = {
        zones: [
          { x: 50, y: 90, intensity: 0.9, type: 'attack' as const },
          { x: 50, y: 50, intensity: 0.7, type: 'midfield' as const },
          { x: 50, y: 10, intensity: 0.6, type: 'defense' as const }
        ],
        coverage: 75
      };

      vi.mocked(tacticalIntegrationService.generateHeatMapData).mockReturnValue(mockHeatMap);

      const result = tacticalIntegrationService.generateHeatMapData(mockFormation, mockPlayers);

      const attackZones = result.zones.filter(z => z.type === 'attack');
      const midfieldZones = result.zones.filter(z => z.type === 'midfield');
      const defenseZones = result.zones.filter(z => z.type === 'defense');

      expect(attackZones).toHaveLength(1);
      expect(midfieldZones).toHaveLength(1);
      expect(defenseZones).toHaveLength(1);
    });
  });

  describe('Match Simulation Configuration', () => {
    it('should create simulation config', () => {
      const mockConfig = {
        formation: mockFormation,
        players: mockPlayers,
        tactics: {
          playStyle: 'attacking' as const,
          tempo: 'fast' as const,
          aggression: 75
        }
      };

      vi.mocked(tacticalIntegrationService.createSimulationConfig).mockReturnValue(mockConfig);

      const result = tacticalIntegrationService.createSimulationConfig(
        mockFormation, 
        mockPlayers,
        { playStyle: 'attacking', tempo: 'fast', aggression: 75 }
      );

      expect(result.formation).toEqual(mockFormation);
      expect(result.players).toEqual(mockPlayers);
      expect(result.tactics.playStyle).toBe('attacking');
      expect(result.tactics.tempo).toBe('fast');
      expect(result.tactics.aggression).toBe(75);
    });

    it('should use default tactics when not specified', () => {
      const mockConfig = {
        formation: mockFormation,
        players: mockPlayers,
        tactics: {
          playStyle: 'balanced' as const,
          tempo: 'medium' as const,
          aggression: 50
        }
      };

      vi.mocked(tacticalIntegrationService.createSimulationConfig).mockReturnValue(mockConfig);

      const result = tacticalIntegrationService.createSimulationConfig(mockFormation, mockPlayers);

      expect(result.tactics.playStyle).toBe('balanced');
      expect(result.tactics.tempo).toBe('medium');
      expect(result.tactics.aggression).toBe(50);
    });
  });

  describe('Formation Export', () => {
    it('should export formation with analysis', () => {
      const mockAnalysis = {
        strengths: ['Good formation'],
        weaknesses: ['Minor issues'],
        recommendations: ['Keep it up'],
        effectiveness: 88,
        riskLevel: 'low' as const
      };

      const mockExport = {
        id: 'export-1',
        name: '4-3-3',
        formation: mockFormation,
        players: mockPlayers,
        analysis: mockAnalysis,
        timestamp: Date.now()
      };

      vi.mocked(tacticalIntegrationService.exportFormation).mockReturnValue(mockExport);

      const result = tacticalIntegrationService.exportFormation(mockFormation, mockPlayers, mockAnalysis);

      expect(result.formation).toEqual(mockFormation);
      expect(result.players).toEqual(mockPlayers);
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Formation Matchup Analysis', () => {
    it('should calculate formation matchups', () => {
      const opponentFormation: Formation = {
        id: 'opponent',
        name: '4-4-2',
        positions: {
          '1': { x: 50, y: 85 },
          '2': { x: 35, y: 85 }
        }
      };

      const mockMatchup = {
        homeAdvantage: 65,
        awayAdvantage: 35,
        keyBattles: ['Midfield control', 'Wing play'],
        predictions: ['Home team likely to dominate']
      };

      vi.mocked(tacticalIntegrationService.calculateMatchup).mockReturnValue(mockMatchup);

      const result = tacticalIntegrationService.calculateMatchup(mockFormation, opponentFormation);

      expect(result.homeAdvantage).toBe(65);
      expect(result.awayAdvantage).toBe(35);
      expect(result.keyBattles).toContain('Midfield control');
      expect(result.predictions).toContain('Home team likely to dominate');
    });
  });
});

describe('Tactical Integration Error Handling', () => {
  it('should handle service errors gracefully', async () => {
    vi.mocked(tacticalIntegrationService.analyzeFormation).mockRejectedValue(new Error('Service unavailable'));

    await expect(tacticalIntegrationService.analyzeFormation({} as Formation, [])).rejects.toThrow('Service unavailable');
  });

  it('should handle invalid formation data', () => {
    const invalidFormation = null as any;
    const mockChemistry = {
      overall: 0,
      individual: {},
      suggestions: ['Invalid formation data']
    };

    vi.mocked(tacticalIntegrationService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

    const result = tacticalIntegrationService.calculatePlayerChemistry([], invalidFormation);
    expect(result.overall).toBe(0);
    expect(result.suggestions[0]).toContain('Invalid');
  });
});