/**
 * Advanced Heatmap Analytics
 * Generates tactical heatmaps for player positioning, movement patterns, and zone coverage
 */

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  playerId?: string;
  timestamp?: number;
}

export interface MovementPattern {
  playerId: string;
  playerName: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  frequency: number;
  avgSpeed: number;
  distance: number;
}

export interface InfluenceZone {
  playerId: string;
  playerName: string;
  center: { x: number; y: number };
  radius: number;
  influence: number;
  coverage: number;
}

export interface ZoneCoverage {
  zone: string;
  coverage: number;
  players: string[];
  dominant: boolean;
  avgIntensity: number;
}

export interface HeatmapData {
  positions: HeatmapPoint[];
  movementPatterns: MovementPattern[];
  influenceZones: InfluenceZone[];
  zoneCoverage: ZoneCoverage[];
  metadata: {
    generatedAt: number;
    dataPoints: number;
    timeRange: { start: number; end: number };
    fieldDimensions: { width: number; height: number };
  };
}

export interface HeatmapOptions {
  fieldWidth: number;
  fieldHeight: number;
  gridResolution: number;
  intensityThreshold: number;
  smoothingRadius: number;
  timeWindow?: number;
}

const DEFAULT_OPTIONS: HeatmapOptions = {
  fieldWidth: 105,
  fieldHeight: 68,
  gridResolution: 20,
  intensityThreshold: 0.1,
  smoothingRadius: 5,
};

class HeatmapAnalytics {
  private static instance: HeatmapAnalytics;
  private positionHistory: Map<string, HeatmapPoint[]> = new Map();
  private options: HeatmapOptions;

  private constructor(options: Partial<HeatmapOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  public static getInstance(options?: Partial<HeatmapOptions>): HeatmapAnalytics {
    if (!HeatmapAnalytics.instance) {
      HeatmapAnalytics.instance = new HeatmapAnalytics(options);
    }
    return HeatmapAnalytics.instance;
  }

  /**
   * Record player position
   */
  public recordPosition(
    playerId: string,
    x: number,
    y: number,
    intensity: number = 1,
    timestamp?: number,
  ): void {
    if (!this.positionHistory.has(playerId)) {
      this.positionHistory.set(playerId, []);
    }

    const point: HeatmapPoint = {
      x,
      y,
      intensity,
      playerId,
      timestamp: timestamp || Date.now(),
    };

    this.positionHistory.get(playerId)?.push(point);

    // Limit history size
    const history = this.positionHistory.get(playerId);
    if (history && history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Generate heatmap data for a player
   */
  public generatePlayerHeatmap(playerId: string): HeatmapPoint[] {
    const history = this.positionHistory.get(playerId) || [];
    const grid = this.createGrid();

    // Populate grid with position data
    history.forEach(point => {
      const gridX = Math.floor((point.x / this.options.fieldWidth) * this.options.gridResolution);
      const gridY = Math.floor((point.y / this.options.fieldHeight) * this.options.gridResolution);

      if (
        gridX >= 0 &&
        gridX < this.options.gridResolution &&
        gridY >= 0 &&
        gridY < this.options.gridResolution
      ) {
        grid[gridY][gridX] += point.intensity;
      }
    });

    // Apply Gaussian smoothing
    const smoothed = this.applyGaussianSmoothing(grid);

    // Convert grid to heatmap points
    return this.gridToPoints(smoothed);
  }

  /**
   * Generate heatmap data for all players
   */
  public generateTeamHeatmap(): HeatmapPoint[] {
    const grid = this.createGrid();

    // Combine all player positions
    this.positionHistory.forEach(history => {
      history.forEach(point => {
        const gridX = Math.floor((point.x / this.options.fieldWidth) * this.options.gridResolution);
        const gridY = Math.floor(
          (point.y / this.options.fieldHeight) * this.options.gridResolution,
        );

        if (
          gridX >= 0 &&
          gridX < this.options.gridResolution &&
          gridY >= 0 &&
          gridY < this.options.gridResolution
        ) {
          grid[gridY][gridX] += point.intensity;
        }
      });
    });

    // Apply Gaussian smoothing
    const smoothed = this.applyGaussianSmoothing(grid);

    // Convert grid to heatmap points
    return this.gridToPoints(smoothed);
  }

  /**
   * Analyze movement patterns for a player
   */
  public analyzeMovementPatterns(
    playerId: string,
    playerName: string,
    minFrequency: number = 2,
  ): MovementPattern[] {
    const history = this.positionHistory.get(playerId) || [];
    if (history.length < 2) {
      return [];
    }

    const patterns: Map<string, MovementPattern> = new Map();

    // Analyze consecutive positions to find movement patterns
    for (let i = 1; i < history.length; i++) {
      const from = history[i - 1];
      const to = history[i];

      // Calculate distance
      const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));

      // Skip if movement is too small
      if (distance < 1) {
        continue;
      }

      // Calculate speed (distance per second)
      const timeDiff = (to.timestamp || 0) - (from.timestamp || 0);
      const avgSpeed = timeDiff > 0 ? distance / (timeDiff / 1000) : 0;

      // Create pattern key based on discretized positions
      const fromKey = `${Math.floor(from.x)},${Math.floor(from.y)}`;
      const toKey = `${Math.floor(to.x)},${Math.floor(to.y)}`;
      const patternKey = `${fromKey}->${toKey}`;

      // Update or create pattern
      if (patterns.has(patternKey)) {
        const existing = patterns.get(patternKey)!;
        existing.frequency++;
        existing.avgSpeed = (existing.avgSpeed + avgSpeed) / 2;
      } else {
        patterns.set(patternKey, {
          playerId,
          playerName,
          from: { x: from.x, y: from.y },
          to: { x: to.x, y: to.y },
          frequency: 1,
          avgSpeed,
          distance,
        });
      }
    }

    // Filter by minimum frequency and sort by frequency
    return Array.from(patterns.values())
      .filter(pattern => pattern.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate influence zones for players
   */
  public calculateInfluenceZones(
    playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
  ): InfluenceZone[] {
    return playerPositions.map(player => {
      const history = this.positionHistory.get(player.playerId) || [];

      // Calculate average position
      const avgX =
        history.length > 0 ? history.reduce((sum, p) => sum + p.x, 0) / history.length : player.x;
      const avgY =
        history.length > 0 ? history.reduce((sum, p) => sum + p.y, 0) / history.length : player.y;

      // Calculate standard deviation to determine radius
      const variance =
        history.length > 0
          ? history.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2), 0) /
            history.length
          : 0;
      const radius = Math.sqrt(variance) * 2;

      // Calculate influence based on activity and position coverage
      const influence = Math.min(1, history.length / 100);

      // Calculate coverage area (percentage of field)
      const area = Math.PI * Math.pow(radius, 2);
      const fieldArea = this.options.fieldWidth * this.options.fieldHeight;
      const coverage = (area / fieldArea) * 100;

      return {
        playerId: player.playerId,
        playerName: player.playerName,
        center: { x: avgX, y: avgY },
        radius: Math.max(radius, 5),
        influence,
        coverage: Math.min(coverage, 100),
      };
    });
  }

  /**
   * Analyze zone coverage
   */
  public analyzeZoneCoverage(): ZoneCoverage[] {
    const zones = this.defineZones();
    const coverage: ZoneCoverage[] = [];

    zones.forEach(zone => {
      const playersInZone = new Set<string>();
      let totalIntensity = 0;
      let dataPoints = 0;

      this.positionHistory.forEach((history, playerId) => {
        history.forEach(point => {
          if (this.isPointInZone(point, zone)) {
            playersInZone.add(playerId);
            totalIntensity += point.intensity;
            dataPoints++;
          }
        });
      });

      const avgIntensity = dataPoints > 0 ? totalIntensity / dataPoints : 0;
      const coveragePercent = Math.min(100, (dataPoints / 100) * 100);

      coverage.push({
        zone: zone.name,
        coverage: coveragePercent,
        players: Array.from(playersInZone),
        dominant: coveragePercent > 70,
        avgIntensity,
      });
    });

    return coverage.sort((a, b) => b.coverage - a.coverage);
  }

  /**
   * Generate complete heatmap data
   */
  public generateCompleteHeatmap(
    playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
  ): HeatmapData {
    const positions = this.generateTeamHeatmap();
    const movementPatterns = playerPositions.flatMap(player =>
      this.analyzeMovementPatterns(player.playerId, player.playerName),
    );
    const influenceZones = this.calculateInfluenceZones(playerPositions);
    const zoneCoverage = this.analyzeZoneCoverage();

    // Calculate time range
    let minTime = Infinity;
    let maxTime = -Infinity;
    this.positionHistory.forEach(history => {
      history.forEach(point => {
        if (point.timestamp) {
          minTime = Math.min(minTime, point.timestamp);
          maxTime = Math.max(maxTime, point.timestamp);
        }
      });
    });

    return {
      positions,
      movementPatterns,
      influenceZones,
      zoneCoverage,
      metadata: {
        generatedAt: Date.now(),
        dataPoints: positions.length,
        timeRange: {
          start: isFinite(minTime) ? minTime : Date.now(),
          end: isFinite(maxTime) ? maxTime : Date.now(),
        },
        fieldDimensions: {
          width: this.options.fieldWidth,
          height: this.options.fieldHeight,
        },
      },
    };
  }

  /**
   * Clear position history
   */
  public clearHistory(playerId?: string): void {
    if (playerId) {
      this.positionHistory.delete(playerId);
    } else {
      this.positionHistory.clear();
    }
  }

  /**
   * Export heatmap data as JSON
   */
  public exportJSON(data: HeatmapData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Create empty grid
   */
  private createGrid(): number[][] {
    return Array(this.options.gridResolution)
      .fill(0)
      .map(() => Array(this.options.gridResolution).fill(0));
  }

  /**
   * Apply Gaussian smoothing to grid
   */
  private applyGaussianSmoothing(grid: number[][]): number[][] {
    const smoothed = this.createGrid();
    const radius = this.options.smoothingRadius;
    const sigma = radius / 3;

    for (let y = 0; y < this.options.gridResolution; y++) {
      for (let x = 0; x < this.options.gridResolution; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (
              nx >= 0 &&
              nx < this.options.gridResolution &&
              ny >= 0 &&
              ny < this.options.gridResolution
            ) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
              sum += grid[ny][nx] * weight;
              weightSum += weight;
            }
          }
        }

        smoothed[y][x] = weightSum > 0 ? sum / weightSum : 0;
      }
    }

    return smoothed;
  }

  /**
   * Convert grid to heatmap points
   */
  private gridToPoints(grid: number[][]): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];
    let maxIntensity = 0;

    // Find max intensity for normalization
    grid.forEach(row => {
      row.forEach(value => {
        maxIntensity = Math.max(maxIntensity, value);
      });
    });

    // Convert grid to points
    for (let y = 0; y < this.options.gridResolution; y++) {
      for (let x = 0; x < this.options.gridResolution; x++) {
        const intensity = maxIntensity > 0 ? grid[y][x] / maxIntensity : 0;

        if (intensity >= this.options.intensityThreshold) {
          points.push({
            x: (x / this.options.gridResolution) * this.options.fieldWidth,
            y: (y / this.options.gridResolution) * this.options.fieldHeight,
            intensity,
          });
        }
      }
    }

    return points;
  }

  /**
   * Define field zones
   */
  private defineZones(): Array<{
    name: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }> {
    const w = this.options.fieldWidth;
    const h = this.options.fieldHeight;

    return [
      { name: 'Defensive Third', x1: 0, y1: 0, x2: w, y2: h / 3 },
      { name: 'Middle Third', x1: 0, y1: h / 3, x2: w, y2: (2 * h) / 3 },
      { name: 'Attacking Third', x1: 0, y1: (2 * h) / 3, x2: w, y2: h },
      { name: 'Left Wing', x1: 0, y1: 0, x2: w / 3, y2: h },
      { name: 'Center', x1: w / 3, y1: 0, x2: (2 * w) / 3, y2: h },
      { name: 'Right Wing', x1: (2 * w) / 3, y1: 0, x2: w, y2: h },
      { name: 'Left Defensive', x1: 0, y1: 0, x2: w / 3, y2: h / 3 },
      { name: 'Center Defensive', x1: w / 3, y1: 0, x2: (2 * w) / 3, y2: h / 3 },
      { name: 'Right Defensive', x1: (2 * w) / 3, y1: 0, x2: w, y2: h / 3 },
      { name: 'Left Midfield', x1: 0, y1: h / 3, x2: w / 3, y2: (2 * h) / 3 },
      { name: 'Center Midfield', x1: w / 3, y1: h / 3, x2: (2 * w) / 3, y2: (2 * h) / 3 },
      { name: 'Right Midfield', x1: (2 * w) / 3, y1: h / 3, x2: w, y2: (2 * h) / 3 },
      { name: 'Left Attacking', x1: 0, y1: (2 * h) / 3, x2: w / 3, y2: h },
      { name: 'Center Attacking', x1: w / 3, y1: (2 * h) / 3, x2: (2 * w) / 3, y2: h },
      { name: 'Right Attacking', x1: (2 * w) / 3, y1: (2 * h) / 3, x2: w, y2: h },
    ];
  }

  /**
   * Check if point is in zone
   */
  private isPointInZone(
    point: HeatmapPoint,
    zone: { x1: number; y1: number; x2: number; y2: number },
  ): boolean {
    return point.x >= zone.x1 && point.x <= zone.x2 && point.y >= zone.y1 && point.y <= zone.y2;
  }
}

// Export singleton instance
export const heatmapAnalytics = HeatmapAnalytics.getInstance();

// Helper hook for React components
export const useHeatmapAnalytics = () => {
  return {
    recordPosition: (playerId: string, x: number, y: number, intensity?: number) =>
      heatmapAnalytics.recordPosition(playerId, x, y, intensity),
    generatePlayerHeatmap: (playerId: string) => heatmapAnalytics.generatePlayerHeatmap(playerId),
    generateTeamHeatmap: () => heatmapAnalytics.generateTeamHeatmap(),
    analyzeMovementPatterns: (playerId: string, playerName: string) =>
      heatmapAnalytics.analyzeMovementPatterns(playerId, playerName),
    calculateInfluenceZones: (
      playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
    ) => heatmapAnalytics.calculateInfluenceZones(playerPositions),
    analyzeZoneCoverage: () => heatmapAnalytics.analyzeZoneCoverage(),
    generateCompleteHeatmap: (
      playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>,
    ) => heatmapAnalytics.generateCompleteHeatmap(playerPositions),
    clearHistory: (playerId?: string) => heatmapAnalytics.clearHistory(playerId),
  };
};
