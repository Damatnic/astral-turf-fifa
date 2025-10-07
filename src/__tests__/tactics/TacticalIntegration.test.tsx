import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { TacticalIntegrationService } from '../../services/tacticalIntegrationService';
import { type Formation, type Player } from '../../types';
import { createMockPlayer } from '../../test-utils/mock-factories/player.factory';

// Mock the service
vi.mock('../../services/tacticalIntegrationService', () => ({
  TacticalIntegrationService: {
    analyzeFormation: vi.fn(),
    calculateMatchup: vi.fn(),
    exportFormation: vi.fn(),
    createSimulationConfig: vi.fn(),
    calculatePlayerChemistry: vi.fn(),
    generateHeatMapData: vi.fn(),
  },
}));

// Type assertion for mocked service to allow mock methods
const MockedService = TacticalIntegrationService as any;

describe('Tactical Integration Service', () => {
  const mockFormation: Formation = {
    id: 'test-formation',
    name: '4-3-3',
    slots: [
      { id: '1', role: 'Goalkeeper', defaultPosition: { x: 50, y: 80 }, playerId: null },
      { id: '2', role: 'Left Back', defaultPosition: { x: 30, y: 60 }, playerId: null },
      { id: '3', role: 'Right Back', defaultPosition: { x: 70, y: 60 }, playerId: null },
      { id: '4', role: 'Center Mid', defaultPosition: { x: 50, y: 40 }, playerId: null },
    ],
  };

  const mockPlayers: Player[] = [
    createMockPlayer({
      id: '1',
      name: 'Striker',
      roleId: 'striker',
      currentPotential: 90,
      age: 25,
    }),
    createMockPlayer({
      id: '2',
      name: 'Left Midfielder',
      roleId: 'left-midfielder',
      currentPotential: 85,
      age: 23,
    }),
    createMockPlayer({
      id: '3',
      name: 'Right Midfielder',
      roleId: 'right-midfielder',
      currentPotential: 82,
      age: 24,
    }),
    createMockPlayer({
      id: '4',
      name: 'Defensive Midfielder',
      roleId: 'defensive-midfielder',
      currentPotential: 78,
      age: 26,
    }),
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
        riskLevel: 'medium' as const,
      };

      vi.mocked((TacticalIntegrationService as any).analyzeFormation).mockResolvedValue(
        mockAnalysis,
      );

      const result = await (TacticalIntegrationService as any).analyzeFormation(
        mockFormation,
        mockPlayers,
      );

      expect((TacticalIntegrationService as any).analyzeFormation).toHaveBeenCalledWith(
        mockFormation,
        mockPlayers,
      );
      expect(result).toEqual(mockAnalysis);
      expect((result as any).effectiveness).toBe(85);
      expect((result as any).riskLevel).toBe('medium');
    });

    it('should handle empty formation gracefully', async () => {
      const emptyFormation: Formation = {
        id: 'empty',
        name: 'Empty',
        slots: [],
      };

      const mockAnalysis = {
        strengths: [],
        weaknesses: ['No players positioned'],
        recommendations: ['Add players to formation'],
        effectiveness: 0,
        riskLevel: 'high' as const,
      };

      vi.mocked(MockedService.analyzeFormation).mockResolvedValue(mockAnalysis);

      const result = await MockedService.analyzeFormation(emptyFormation, []);
      expect((result as any).effectiveness).toBe(0);
      expect((result as any).riskLevel).toBe('high');
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
          '4': 85,
        },
        suggestions: ['Good chemistry overall'],
      };

      vi.mocked(MockedService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

      const result = MockedService.calculatePlayerChemistry(mockPlayers, mockFormation);

      expect(MockedService.calculatePlayerChemistry).toHaveBeenCalledWith(
        mockPlayers,
        mockFormation,
      );
      expect((result as any).overall).toBe(85);
      expect((result as any).individual['1']).toBe(90);
      expect((result as any).suggestions).toContain('Good chemistry overall');
    });

    it('should identify low chemistry players', () => {
      const mockChemistry = {
        overall: 65,
        individual: {
          '1': 90,
          '2': 45, // Low chemistry
          '3': 82,
          '4': 85,
        },
        suggestions: ['Consider repositioning Left Midfielder for better chemistry'],
      };

      vi.mocked(MockedService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

      const result = MockedService.calculatePlayerChemistry(mockPlayers, mockFormation);

      expect((result as any).individual['2']).toBe(45);
      expect((result as any).suggestions[0]).toContain('repositioning');
    });
  });

  describe('Heat Map Generation', () => {
    it('should generate heat map data', () => {
      const mockHeatMap = {
        zones: [
          { x: 50, y: 80, intensity: 0.9, type: 'attack' as const },
          { x: 30, y: 60, intensity: 0.7, type: 'midfield' as const },
          { x: 70, y: 60, intensity: 0.7, type: 'midfield' as const },
          { x: 50, y: 40, intensity: 0.6, type: 'defense' as const },
        ],
        coverage: 85,
      };

      vi.mocked(MockedService.generateHeatMapData).mockReturnValue(mockHeatMap);

      const result = MockedService.generateHeatMapData(mockFormation, mockPlayers);

      expect(MockedService.generateHeatMapData).toHaveBeenCalledWith(mockFormation, mockPlayers);
      expect((result as any).zones).toHaveLength(4);
      expect((result as any).coverage).toBe(85);
      expect((result as any).zones[0].type).toBe('attack');
    });

    it('should handle different zone types correctly', () => {
      const mockHeatMap = {
        zones: [
          { x: 50, y: 90, intensity: 0.9, type: 'attack' as const },
          { x: 50, y: 50, intensity: 0.7, type: 'midfield' as const },
          { x: 50, y: 10, intensity: 0.6, type: 'defense' as const },
        ],
        coverage: 75,
      };

      vi.mocked(MockedService.generateHeatMapData).mockReturnValue(mockHeatMap);

      const result = MockedService.generateHeatMapData(mockFormation, mockPlayers);

      const attackZones = (result as any).zones.filter((z: any) => z.type === 'attack');
      const midfieldZones = (result as any).zones.filter((z: any) => z.type === 'midfield');
      const defenseZones = (result as any).zones.filter((z: any) => z.type === 'defense');

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
          aggression: 75,
        },
      };

      vi.mocked(MockedService.createSimulationConfig).mockReturnValue(mockConfig);

      const result = MockedService.createSimulationConfig(mockFormation, mockPlayers, {
        playStyle: 'attacking',
        tempo: 'fast',
        aggression: 75,
      });

      expect((result as any).formation).toEqual(mockFormation);
      expect((result as any).players).toEqual(mockPlayers);
      expect((result as any).tactics.playStyle).toBe('attacking');
      expect((result as any).tactics.tempo).toBe('fast');
      expect((result as any).tactics.aggression).toBe(75);
    });

    it('should use default tactics when not specified', () => {
      const mockConfig = {
        formation: mockFormation,
        players: mockPlayers,
        tactics: {
          playStyle: 'balanced' as const,
          tempo: 'medium' as const,
          aggression: 50,
        },
      };

      vi.mocked(MockedService.createSimulationConfig).mockReturnValue(mockConfig);

      const result = MockedService.createSimulationConfig(mockFormation, mockPlayers);

      expect((result as any).tactics.playStyle).toBe('balanced');
      expect((result as any).tactics.tempo).toBe('medium');
      expect((result as any).tactics.aggression).toBe(50);
    });
  });

  describe('Formation Export', () => {
    it('should export formation with analysis', () => {
      const mockAnalysis = {
        strengths: ['Good formation'],
        weaknesses: ['Minor issues'],
        recommendations: ['Keep it up'],
        effectiveness: 88,
        riskLevel: 'low' as const,
      };

      const mockExport = {
        id: 'export-1',
        name: '4-3-3',
        formation: mockFormation,
        players: mockPlayers,
        analysis: mockAnalysis,
        timestamp: Date.now(),
      };

      vi.mocked(MockedService.exportFormation).mockReturnValue(mockExport);

      const result = MockedService.exportFormation(mockFormation, mockPlayers, mockAnalysis);

      expect((result as any).formation).toEqual(mockFormation);
      expect((result as any).players).toEqual(mockPlayers);
      expect((result as any).analysis).toEqual(mockAnalysis);
      expect((result as any).timestamp).toBeDefined();
    });
  });

  describe('Formation Matchup Analysis', () => {
    it('should calculate formation matchups', () => {
      const opponentFormation: Formation = {
        id: 'opponent',
        name: '4-4-2',
        slots: [
          { id: '1', role: 'Goalkeeper', defaultPosition: { x: 50, y: 85 }, playerId: null },
          { id: '2', role: 'Left Back', defaultPosition: { x: 35, y: 85 }, playerId: null },
        ],
      };

      const mockMatchup = {
        homeAdvantage: 65,
        awayAdvantage: 35,
        keyBattles: ['Midfield control', 'Wing play'],
        predictions: ['Home team likely to dominate'],
      };

      vi.mocked(MockedService.calculateMatchup).mockReturnValue(mockMatchup);

      const result = MockedService.calculateMatchup(mockFormation, opponentFormation);

      expect((result as any).homeAdvantage).toBe(65);
      expect((result as any).awayAdvantage).toBe(35);
      expect((result as any).keyBattles).toContain('Midfield control');
      expect((result as any).predictions).toContain('Home team likely to dominate');
    });
  });
});

describe('Tactical Integration Error Handling', () => {
  it('should handle service errors gracefully', async () => {
    vi.mocked(MockedService.analyzeFormation).mockRejectedValue(new Error('Service unavailable'));

    await expect(MockedService.analyzeFormation({} as Formation, [])).rejects.toThrow(
      'Service unavailable',
    );
  });

  it('should handle invalid formation data', () => {
    const invalidFormation = null as any;
    const mockChemistry = {
      overall: 0,
      individual: {},
      suggestions: ['Invalid formation data'],
    };

    vi.mocked(MockedService.calculatePlayerChemistry).mockReturnValue(mockChemistry);

    const result = MockedService.calculatePlayerChemistry([], invalidFormation);
    expect((result as any).overall).toBe(0);
    expect((result as any).suggestions[0]).toContain('Invalid');
  });
});
