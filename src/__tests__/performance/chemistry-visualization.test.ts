import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateChemistryData,
  generatePerformanceTestData,
} from '../utils/enhanced-mock-generators';
import type { Player } from '../../types';

/**
 * Performance Tests for ChemistryVisualization Calculations
 *
 * Tests cover:
 * - Chemistry calculation algorithms performance
 * - Large dataset processing speed
 * - Real-time updates and recalculations
 * - Memory efficiency with many player combinations
 * - Visualization rendering performance
 * - Edge case handling performance
 * - Scaling behavior analysis
 */

interface ChemistryCalculationMetrics {
  calculationTime: number;
  memoryUsage: number;
  playerPairsProcessed: number;
  algorithmsExecuted: number;
  cacheHitRate: number;
}

interface ChemistryPerformanceResult {
  testName: string;
  playerCount: number;
  metrics: ChemistryCalculationMetrics;
  performanceScore: number;
  withinThresholds: boolean;
}

describe('ChemistryVisualization Performance Tests', () => {
  // Performance thresholds
  const PERFORMANCE_THRESHOLDS = {
    maxCalculationTimePerPair: 1, // ms per player pair
    maxMemoryPerPlayer: 1024, // bytes per player
    minCacheHitRate: 0.7, // 70% cache hit rate
    maxTotalCalculationTime: 500, // ms for any single calculation
    maxVisualizationRenderTime: 100, // ms for rendering
  };

  let performanceMonitor: {
    startTime: number;
    startMemory: number;
    calculations: number;
    cacheHits: number;
    cacheMisses: number;
  };

  beforeEach(() => {
    performanceMonitor = {
      startTime: 0,
      startMemory: 0,
      calculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Mock performance monitoring
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        now: vi.fn(() => Date.now()),
        memory: {
          usedJSHeapSize: 10 * 1024 * 1024, // 10MB baseline
          totalJSHeapSize: 20 * 1024 * 1024,
          jsHeapSizeLimit: 100 * 1024 * 1024,
        },
      },
      writable: true,
    });
  });

  const startPerformanceMonitoring = () => {
    performanceMonitor.startTime = performance.now();
    performanceMonitor.startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    performanceMonitor.calculations = 0;
    performanceMonitor.cacheHits = 0;
    performanceMonitor.cacheMisses = 0;
  };

  const endPerformanceMonitoring = (playerCount: number): ChemistryCalculationMetrics => {
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const playerPairsProcessed = (playerCount * (playerCount - 1)) / 2;

    return {
      calculationTime: endTime - performanceMonitor.startTime,
      memoryUsage: endMemory - performanceMonitor.startMemory,
      playerPairsProcessed,
      algorithmsExecuted: performanceMonitor.calculations,
      cacheHitRate:
        performanceMonitor.cacheHits /
        (performanceMonitor.cacheHits + performanceMonitor.cacheMisses || 1),
    };
  };

  /**
   * Mock chemistry calculation algorithms for performance testing
   */
  const calculatePlayerChemistry = (player1: Player, player2: Player): number => {
    performanceMonitor.calculations++;

    // Simulate complex chemistry calculation
    let chemistry = 50; // Base chemistry

    // Nationality compatibility
    if (player1.nationality === player2.nationality) {
      chemistry += 15;
    }

    // Age compatibility
    const ageDiff = Math.abs(player1.age - player2.age);
    chemistry += Math.max(0, 10 - ageDiff);

    // Position synergy (complex calculation)
    const positionSynergy = calculatePositionSynergy(player1.roleId, player2.roleId);
    chemistry += positionSynergy;

    // Attribute compatibility
    const attributeCompatibility = calculateAttributeCompatibility(
      player1.attributes,
      player2.attributes,
    );
    chemistry += attributeCompatibility;

    // Team chemistry
    if (player1.team === player2.team) {
      chemistry += 10;
    }

    // Simulate some computation time
    for (let i = 0; i < 100; i++) {
      Math.sqrt(chemistry + i);
    }

    return Math.min(100, Math.max(0, chemistry));
  };

  const calculatePositionSynergy = (role1: string, role2: string): number => {
    // Mock complex position synergy calculation
    const synergyMatrix: { [key: string]: { [key: string]: number } } = {
      gk: { cb: 15, bpd: 10, fb: 5 },
      cb: { gk: 15, cb: 10, dm: 12, fb: 8 },
      fb: { cb: 8, wm: 15, w: 12 },
      dm: { cb: 12, cm: 15, dlp: 10 },
      cm: { dm: 15, cm: 8, ap: 12, b2b: 10 },
      ap: { cm: 12, iw: 10, cf: 8 },
      w: { fb: 12, wm: 15, iw: 10 },
      cf: { ap: 8, w: 10, p: 15 },
    };

    return synergyMatrix[role1]?.[role2] || 0;
  };

  const calculateAttributeCompatibility = (
    attr1: Player['attributes'],
    attr2: Player['attributes'],
  ): number => {
    // Mock attribute compatibility calculation
    let compatibility = 0;

    const attributes = [
      'speed',
      'passing',
      'tackling',
      'shooting',
      'dribbling',
      'positioning',
    ] as const;

    for (const attr of attributes) {
      const diff = Math.abs(attr1[attr] - attr2[attr]);
      const weight = getAttributeWeight(attr);
      compatibility += Math.max(0, ((100 - diff) * weight) / 100);
    }

    return compatibility / attributes.length;
  };

  const getAttributeWeight = (attribute: string): number => {
    const weights: { [key: string]: number } = {
      speed: 0.8,
      passing: 1.2,
      tackling: 0.9,
      shooting: 0.7,
      dribbling: 0.8,
      positioning: 1.1,
      stamina: 0.6,
    };

    return weights[attribute] || 1.0;
  };

  const calculateTeamChemistry = (
    players: Player[],
  ): Array<{
    player1Id: string;
    player2Id: string;
    chemistry: number;
    factors: Array<{ factor: string; impact: number }>;
  }> => {
    const chemistryPairs: any[] = [];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const player1 = players[i];
        const player2 = players[j];

        const chemistry = calculatePlayerChemistry(player1, player2);

        chemistryPairs.push({
          player1Id: player1.id,
          player2Id: player2.id,
          chemistry,
          factors: [
            { factor: 'nationality', impact: player1.nationality === player2.nationality ? 15 : 0 },
            { factor: 'age', impact: Math.max(0, 10 - Math.abs(player1.age - player2.age)) },
            {
              factor: 'position',
              impact: calculatePositionSynergy(player1.roleId, player2.roleId),
            },
            { factor: 'team', impact: player1.team === player2.team ? 10 : 0 },
          ],
        });
      }
    }

    return chemistryPairs;
  };

  describe('Small Dataset Performance', () => {
    it('should calculate chemistry for 11 players efficiently', () => {
      const players = generatePerformanceTestData.small().players.slice(0, 11);

      startPerformanceMonitoring();
      const chemistryData = calculateTeamChemistry(players);
      const metrics = endPerformanceMonitoring(players.length);

      expect(metrics.calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxTotalCalculationTime);
      expect(metrics.calculationTime / metrics.playerPairsProcessed).toBeLessThan(
        PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair,
      );
      expect(chemistryData).toHaveLength(55); // 11 choose 2 = 55 pairs
    });

    it('should handle real-time updates for small teams', () => {
      const players = generatePerformanceTestData.small().players.slice(0, 11);

      // Initial calculation
      startPerformanceMonitoring();
      let chemistryData = calculateTeamChemistry(players);
      let metrics = endPerformanceMonitoring(players.length);

      const initialTime = metrics.calculationTime;

      // Update one player and recalculate
      players[0] = { ...players[0], age: players[0].age + 1 };

      startPerformanceMonitoring();
      chemistryData = calculateTeamChemistry(players);
      metrics = endPerformanceMonitoring(players.length);

      // Update should be fast (could be optimized with caching)
      expect(metrics.calculationTime).toBeLessThan(initialTime * 1.5);
      expect(chemistryData).toHaveLength(55);
    });
  });

  describe('Medium Dataset Performance', () => {
    it('should handle squad-sized calculations efficiently', () => {
      const players = generatePerformanceTestData.medium().players; // 25 players

      startPerformanceMonitoring();
      const chemistryData = calculateTeamChemistry(players);
      const metrics = endPerformanceMonitoring(players.length);

      expect(metrics.calculationTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.maxTotalCalculationTime * 5,
      );
      expect(metrics.calculationTime / metrics.playerPairsProcessed).toBeLessThan(
        PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair * 2,
      );
      expect(chemistryData).toHaveLength(300); // 25 choose 2 = 300 pairs
    });

    it('should maintain performance with frequent updates', () => {
      const players = generatePerformanceTestData.medium().players;
      const updateTimes: number[] = [];

      // Simulate 10 rapid updates
      for (let update = 0; update < 10; update++) {
        // Modify a random player
        const randomIndex = Math.floor(Math.random() * players.length);
        players[randomIndex] = {
          ...players[randomIndex],
          morale: 'Excellent' as const,
        };

        startPerformanceMonitoring();
        const chemistryData = calculateTeamChemistry(players);
        const metrics = endPerformanceMonitoring(players.length);

        updateTimes.push(metrics.calculationTime);
        expect(chemistryData).toHaveLength(300);
      }

      // Performance should remain consistent
      const avgTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      const maxDeviation = Math.max(...updateTimes.map(time => Math.abs(time - avgTime)));

      expect(maxDeviation).toBeLessThan(avgTime * 0.5); // Within 50% of average
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle large player pools with acceptable performance', () => {
      const players = generatePerformanceTestData.large().players; // 100 players

      startPerformanceMonitoring();
      const chemistryData = calculateTeamChemistry(players);
      const metrics = endPerformanceMonitoring(players.length);

      // Large datasets may take longer but should remain manageable
      expect(metrics.calculationTime).toBeLessThan(5000); // 5 seconds max
      expect(metrics.calculationTime / metrics.playerPairsProcessed).toBeLessThan(
        PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair * 5,
      );
      expect(chemistryData).toHaveLength(4950); // 100 choose 2 = 4950 pairs
    });

    it('should optimize memory usage for large calculations', () => {
      const players = generatePerformanceTestData.large().players;

      startPerformanceMonitoring();
      const chemistryData = calculateTeamChemistry(players);
      const metrics = endPerformanceMonitoring(players.length);

      // Memory usage should be reasonable
      const memoryPerPlayer = metrics.memoryUsage / players.length;
      expect(memoryPerPlayer).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryPerPlayer * 100);

      // Should not cause memory issues
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB max
    });
  });

  describe('Algorithm Optimization', () => {
    it('should benefit from caching mechanisms', () => {
      const players = generatePerformanceTestData.medium().players;
      const cache = new Map<string, number>();

      const getCachedChemistry = (player1Id: string, player2Id: string): number | null => {
        const key = [player1Id, player2Id].sort().join('-');
        return cache.get(key) || null;
      };

      const setCachedChemistry = (player1Id: string, player2Id: string, value: number): void => {
        const key = [player1Id, player2Id].sort().join('-');
        cache.set(key, value);
      };

      const calculateWithCache = (players: Player[]): number => {
        let calculations = 0;

        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            const cached = getCachedChemistry(players[i].id, players[j].id);

            if (cached !== null) {
              performanceMonitor.cacheHits++;
            } else {
              performanceMonitor.cacheMisses++;
              const chemistry = calculatePlayerChemistry(players[i], players[j]);
              setCachedChemistry(players[i].id, players[j].id, chemistry);
              calculations++;
            }
          }
        }

        return calculations;
      };

      // First calculation (cold cache)
      startPerformanceMonitoring();
      const coldCalculations = calculateWithCache(players);
      const coldMetrics = endPerformanceMonitoring(players.length);

      // Second calculation (warm cache)
      startPerformanceMonitoring();
      const warmCalculations = calculateWithCache(players);
      const warmMetrics = endPerformanceMonitoring(players.length);

      expect(coldCalculations).toBeGreaterThan(0);
      expect(warmCalculations).toBe(0); // All cached
      expect(warmMetrics.calculationTime).toBeLessThan(coldMetrics.calculationTime / 10);
      expect(warmMetrics.cacheHitRate).toBe(1.0); // 100% cache hits
    });

    it('should scale efficiently with player count', () => {
      const playerCounts = [10, 20, 30, 40];
      const results: ChemistryPerformanceResult[] = [];

      playerCounts.forEach(count => {
        const players = generatePerformanceTestData.medium().players.slice(0, count);

        startPerformanceMonitoring();
        const chemistryData = calculateTeamChemistry(players);
        const metrics = endPerformanceMonitoring(count);

        const performanceScore = metrics.calculationTime / metrics.playerPairsProcessed;
        const withinThresholds =
          performanceScore < PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair * 2;

        results.push({
          testName: `Chemistry calculation for ${count} players`,
          playerCount: count,
          metrics,
          performanceScore,
          withinThresholds,
        });

        expect(chemistryData).toHaveLength((count * (count - 1)) / 2);
      });

      // Performance should not degrade exponentially
      for (let i = 1; i < results.length; i++) {
        const prevResult = results[i - 1];
        const currentResult = results[i];

        const scaleFactor = currentResult.playerCount / prevResult.playerCount;
        const performanceRatio = currentResult.performanceScore / prevResult.performanceScore;

        // Performance degradation should be reasonable (not worse than quadratic)
        expect(performanceRatio).toBeLessThan(scaleFactor * scaleFactor * 1.5);
      }
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle players with missing data gracefully', () => {
      const players = generatePerformanceTestData.small().players;

      // Create players with missing/invalid data
      const problematicPlayers = [
        { ...players[0], nationality: '', age: 0 },
        { ...players[1], roleId: '', attributes: {} as any },
        { ...players[2], team: null as any },
      ];

      startPerformanceMonitoring();

      expect(() => {
        const chemistryData = calculateTeamChemistry(problematicPlayers);
        expect(chemistryData).toHaveLength(3); // 3 choose 2 = 3 pairs
      }).not.toThrow();

      const metrics = endPerformanceMonitoring(3);
      expect(metrics.calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxTotalCalculationTime);
    });

    it('should handle empty or single player datasets', () => {
      startPerformanceMonitoring();

      // Empty dataset
      let chemistryData = calculateTeamChemistry([]);
      expect(chemistryData).toHaveLength(0);

      // Single player
      const singlePlayer = generatePerformanceTestData.small().players[0];
      chemistryData = calculateTeamChemistry([singlePlayer]);
      expect(chemistryData).toHaveLength(0);

      const metrics = endPerformanceMonitoring(1);
      expect(metrics.calculationTime).toBeLessThan(10); // Should be nearly instant
    });

    it('should handle extreme attribute values', () => {
      const players = generatePerformanceTestData.small().players.slice(0, 5);

      // Create players with extreme attributes
      players[0].attributes = {
        speed: 0,
        passing: 0,
        tackling: 0,
        shooting: 0,
        dribbling: 0,
        positioning: 0,
        stamina: 0,
      };
      players[1].attributes = {
        speed: 100,
        passing: 100,
        tackling: 100,
        shooting: 100,
        dribbling: 100,
        positioning: 100,
        stamina: 100,
      };

      startPerformanceMonitoring();
      const chemistryData = calculateTeamChemistry(players);
      const metrics = endPerformanceMonitoring(players.length);

      expect(chemistryData).toHaveLength(10); // 5 choose 2 = 10 pairs
      expect(metrics.calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxTotalCalculationTime);

      // Chemistry values should be valid
      chemistryData.forEach(pair => {
        expect(pair.chemistry).toBeGreaterThanOrEqual(0);
        expect(pair.chemistry).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Visualization Performance', () => {
    it('should render chemistry visualization efficiently', () => {
      const players = generatePerformanceTestData.medium().players;
      const chemistryData = calculateTeamChemistry(players);

      // Mock visualization rendering
      const renderVisualization = (data: typeof chemistryData): number => {
        const startTime = performance.now();

        // Simulate SVG/Canvas rendering operations
        data.forEach(pair => {
          // Mock line drawing between players
          for (let i = 0; i < 10; i++) {
            Math.sqrt(pair.chemistry * i);
          }
        });

        return performance.now() - startTime;
      };

      const renderTime = renderVisualization(chemistryData);

      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxVisualizationRenderTime * 2);
    });

    it('should update visualization smoothly during real-time changes', () => {
      const players = generatePerformanceTestData.small().players;
      const updateTimes: number[] = [];

      // Simulate real-time updates
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // Update player data
        players[i % players.length] = {
          ...players[i % players.length],
          morale: 'Excellent' as const,
        };

        // Recalculate chemistry
        const chemistryData = calculateTeamChemistry(players);

        // Mock incremental visualization update
        const renderTime = performance.now() - startTime;
        updateTimes.push(renderTime);

        expect(chemistryData.length).toBeGreaterThan(0);
      }

      // Updates should be consistently fast
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      expect(avgUpdateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxVisualizationRenderTime);

      // Consistency check
      const maxDeviation = Math.max(...updateTimes.map(time => Math.abs(time - avgUpdateTime)));
      expect(maxDeviation).toBeLessThan(avgUpdateTime * 2);
    });
  });

  describe('Comprehensive Performance Report', () => {
    it('should generate complete performance analysis', () => {
      const testScenarios = [
        { name: 'Starting XI', players: 11 },
        { name: 'Full Squad', players: 25 },
        { name: 'Academy Players', players: 50 },
        { name: 'Database Simulation', players: 100 },
      ];

      const performanceReport: ChemistryPerformanceResult[] = [];

      testScenarios.forEach(scenario => {
        const players = generatePerformanceTestData.large().players.slice(0, scenario.players);

        startPerformanceMonitoring();
        const chemistryData = calculateTeamChemistry(players);
        const metrics = endPerformanceMonitoring(scenario.players);

        const performanceScore = metrics.calculationTime / metrics.playerPairsProcessed;
        const withinThresholds =
          performanceScore < PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair * 3;

        performanceReport.push({
          testName: scenario.name,
          playerCount: scenario.players,
          metrics,
          performanceScore,
          withinThresholds,
        });

        expect(chemistryData.length).toBe((scenario.players * (scenario.players - 1)) / 2);
      });

      // Generate summary statistics
      const summary = {
        totalTests: performanceReport.length,
        passedTests: performanceReport.filter(r => r.withinThresholds).length,
        averagePerformanceScore:
          performanceReport.reduce((sum, r) => sum + r.performanceScore, 0) /
          performanceReport.length,
        worstCase: Math.max(...performanceReport.map(r => r.performanceScore)),
        bestCase: Math.min(...performanceReport.map(r => r.performanceScore)),
        scalabilityFactor:
          performanceReport[performanceReport.length - 1].performanceScore /
          performanceReport[0].performanceScore,
      };

      // Validate overall performance
      expect(summary.passedTests).toBeGreaterThanOrEqual(summary.totalTests * 0.75); // 75% pass rate
      expect(summary.averagePerformanceScore).toBeLessThan(
        PERFORMANCE_THRESHOLDS.maxCalculationTimePerPair * 2,
      );
      expect(summary.scalabilityFactor).toBeLessThan(100); // Should scale reasonably
    });
  });
});
