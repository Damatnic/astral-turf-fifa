/**
 * AI Drawing Intelligence Service
 * Smart tactical drawing suggestions and automatic pattern recognition
 */

import { DrawingShape, DrawingTool, Player, Formation } from '../types';

// Geometric analysis for tactical patterns
class GeometricAnalyzer {
  /**
   * Analyze geometric patterns in tactical drawings
   */
  analyzeGeometricPatterns(shapes: DrawingShape[]): GeometricPattern[] {
    const patterns: GeometricPattern[] = [];

    // Analyze lines for passing lanes
    const lines = shapes.filter(s => s.tool === 'line');
    patterns.push(...this.analyzePassingLanes(lines));

    // Analyze zones for defensive/attacking areas
    const zones = shapes.filter(s => s.tool === 'zone');
    patterns.push(...this.analyzeZonalPatterns(zones));

    // Analyze arrows for movement patterns
    const arrows = shapes.filter(s => s.tool === 'arrow');
    patterns.push(...this.analyzeMovementPatterns(arrows));

    return patterns;
  }

  private analyzePassingLanes(lines: DrawingShape[]): GeometricPattern[] {
    const patterns: GeometricPattern[] = [];

    lines.forEach(line => {
      const length = this.calculateLineLength(line.points);
      const angle = this.calculateLineAngle(line.points);

      // Classify passing lane type
      if (length > 30 && Math.abs(angle) < 30) {
        patterns.push({
          type: 'horizontal_passing_lane',
          shape: line,
          confidence: 0.8,
          description: 'Horizontal passing corridor for width',
          tacticalImplication: 'Stretches opposition defense horizontally',
        });
      } else if (length > 30 && Math.abs(angle - 90) < 30) {
        patterns.push({
          type: 'vertical_passing_lane',
          shape: line,
          confidence: 0.8,
          description: 'Vertical passing corridor for penetration',
          tacticalImplication: 'Direct route to goal through central areas',
        });
      } else if (length > 20 && angle > 30 && angle < 60) {
        patterns.push({
          type: 'diagonal_passing_lane',
          shape: line,
          confidence: 0.7,
          description: 'Diagonal passing option for creativity',
          tacticalImplication: 'Bypasses defensive lines with angled passes',
        });
      }
    });

    return patterns;
  }

  private analyzeZonalPatterns(zones: DrawingShape[]): GeometricPattern[] {
    const patterns: GeometricPattern[] = [];

    zones.forEach(zone => {
      const center = this.calculateZoneCenter(zone.points);
      const area = this.calculateZoneArea(zone.points);

      // Classify zone based on position and size
      if (center.y < 30) {
        // Defensive third
        patterns.push({
          type: 'defensive_zone',
          shape: zone,
          confidence: 0.9,
          description: 'Defensive coverage area',
          tacticalImplication: 'Concentrated defensive pressure in this zone',
        });
      } else if (center.y > 70) {
        // Attacking third
        patterns.push({
          type: 'attacking_zone',
          shape: zone,
          confidence: 0.9,
          description: 'Attacking focus area',
          tacticalImplication: 'Primary area for creating scoring chances',
        });
      } else {
        // Middle third
        if (area > 500) {
          patterns.push({
            type: 'midfield_control_zone',
            shape: zone,
            confidence: 0.8,
            description: 'Midfield dominance area',
            tacticalImplication: 'Control this space to dictate tempo',
          });
        } else {
          patterns.push({
            type: 'pressing_zone',
            shape: zone,
            confidence: 0.7,
            description: 'High-intensity pressing area',
            tacticalImplication: 'Trigger zone for coordinated pressing',
          });
        }
      }
    });

    return patterns;
  }

  private analyzeMovementPatterns(arrows: DrawingShape[]): GeometricPattern[] {
    const patterns: GeometricPattern[] = [];

    arrows.forEach(arrow => {
      const direction = this.calculateArrowDirection(arrow.points);
      const length = this.calculateLineLength(arrow.points);

      // Classify movement pattern
      if (direction.y > 0.7 && length > 20) {
        // Forward movement
        patterns.push({
          type: 'attacking_run',
          shape: arrow,
          confidence: 0.8,
          description: 'Forward attacking movement',
          tacticalImplication: 'Penetrating run to stretch defense',
        });
      } else if (direction.y < -0.5 && length > 15) {
        // Backward movement
        patterns.push({
          type: 'defensive_recovery',
          shape: arrow,
          confidence: 0.7,
          description: 'Defensive recovery run',
          tacticalImplication: 'Tracking back to maintain defensive shape',
        });
      } else if (Math.abs(direction.x) > 0.8 && length > 20) {
        // Lateral movement
        patterns.push({
          type: 'width_run',
          shape: arrow,
          confidence: 0.8,
          description: 'Wide attacking run',
          tacticalImplication: 'Creating width to stretch opposition',
        });
      } else if (this.isRotationalMovement(arrow.points)) {
        patterns.push({
          type: 'rotational_movement',
          shape: arrow,
          confidence: 0.6,
          description: 'Rotational positional play',
          tacticalImplication: 'Fluid positional interchange',
        });
      }
    });

    return patterns;
  }

  private calculateLineLength(points: readonly { x: number; y: number }[]): number {
    if (points.length < 2) {
      return 0;
    }

    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    return totalLength;
  }

  private calculateLineAngle(points: readonly { x: number; y: number }[]): number {
    if (points.length < 2) {
      return 0;
    }

    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  private calculateZoneCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const totalX = points.reduce((sum, p) => sum + p.x, 0);
    const totalY = points.reduce((sum, p) => sum + p.y, 0);

    return {
      x: totalX / points.length,
      y: totalY / points.length,
    };
  }

  private calculateZoneArea(points: readonly { x: number; y: number }[]): number {
    if (points.length < 3) {
      return 0;
    }

    // Simplified area calculation using shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  private calculateArrowDirection(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length < 2) {
      return { x: 0, y: 0 };
    }

    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  private isRotationalMovement(points: readonly { x: number; y: number }[]): boolean {
    if (points.length < 4) {
      return false;
    }

    // Check if the path curves back on itself (simplified)
    const start = points[0];
    const end = points[points.length - 1];
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

    const pathLength = this.calculateLineLength(points);

    // If path length is significantly longer than direct distance, it's likely rotational
    return pathLength > distance * 1.5 && distance < 30;
  }
}

// Tactical pattern recognition using machine learning techniques
class TacticalPatternRecognizer {
  private knownPatterns: TacticalPattern[];

  constructor() {
    this.knownPatterns = this.initializeKnownPatterns();
  }

  /**
   * Recognize tactical patterns from drawings and player positions
   */
  recognizePatterns(
    shapes: DrawingShape[],
    players: Player[],
    formation: Formation,
  ): TacticalRecognition {
    const recognizedPatterns: RecognizedPattern[] = [];

    // Recognize formation-based patterns
    recognizedPatterns.push(...this.recognizeFormationPatterns(players, formation));

    // Recognize drawing-based patterns
    recognizedPatterns.push(...this.recognizeDrawingPatterns(shapes));

    // Recognize combined patterns (drawings + positions)
    recognizedPatterns.push(...this.recognizeCombinedPatterns(shapes, players));

    const suggestions = this.generateSmartSuggestions(recognizedPatterns, shapes, players);
    const improvements = this.suggestImprovements(recognizedPatterns, shapes);

    return {
      patterns: recognizedPatterns,
      suggestions,
      improvements,
      confidence: this.calculateOverallConfidence(recognizedPatterns),
    };
  }

  private initializeKnownPatterns(): TacticalPattern[] {
    return [
      {
        name: 'Tiki-Taka',
        type: 'passing_pattern',
        characteristics: {
          shortPasses: true,
          triangularShapes: true,
          highPossession: true,
          compactFormation: true,
        },
        requirements: ['short_passing_triangles', 'compact_positioning', 'high_technical_players'],
      },
      {
        name: 'Counter-Attack',
        type: 'transition_pattern',
        characteristics: {
          longPasses: true,
          fastTransition: true,
          verticalMovement: true,
          widthUsage: true,
        },
        requirements: ['fast_players', 'vertical_runs', 'wide_positioning'],
      },
      {
        name: 'High Press',
        type: 'defensive_pattern',
        characteristics: {
          compactFormation: true,
          highDefensiveLine: true,
          coordinatedMovement: true,
          aggressivePressing: true,
        },
        requirements: ['high_stamina', 'coordinated_movement', 'compact_shape'],
      },
      {
        name: 'Wing Play',
        type: 'attacking_pattern',
        characteristics: {
          widthUsage: true,
          crossing: true,
          overlappingRuns: true,
          stretchDefense: true,
        },
        requirements: ['wide_players', 'crossing_ability', 'aerial_threat'],
      },
    ];
  }

  private recognizeFormationPatterns(players: Player[], formation: Formation): RecognizedPattern[] {
    const patterns: RecognizedPattern[] = [];

    // Analyze player positioning for compact/spread patterns
    const positions = formation.slots
      .filter(slot => slot.playerId)
      .map(slot => slot.defaultPosition);

    const compactness = this.calculateCompactness(positions);
    const width = this.calculateWidth(positions);
    const depth = this.calculateDepth(positions);

    if (compactness < 20) {
      patterns.push({
        name: 'Compact Formation',
        type: 'positional_pattern',
        confidence: 0.8,
        description: 'Team positioned compactly for control',
        implications: ['Better passing options', 'Reduced defensive gaps', 'May lack width'],
      });
    }

    if (width > 60) {
      patterns.push({
        name: 'Wide Formation',
        type: 'positional_pattern',
        confidence: 0.7,
        description: 'Team spread wide across the pitch',
        implications: [
          'Stretches opposition',
          'Creates space centrally',
          'May be vulnerable to quick passing',
        ],
      });
    }

    if (depth > 70) {
      patterns.push({
        name: 'Deep Formation',
        type: 'positional_pattern',
        confidence: 0.7,
        description: 'Team positioned with significant depth',
        implications: [
          'Good defensive coverage',
          'Multiple passing layers',
          'May struggle with high press',
        ],
      });
    }

    return patterns;
  }

  private recognizeDrawingPatterns(shapes: DrawingShape[]): RecognizedPattern[] {
    const patterns: RecognizedPattern[] = [];

    // Analyze drawing complexity and patterns
    const arrows = shapes.filter(s => s.tool === 'arrow');
    const lines = shapes.filter(s => s.tool === 'line');
    const zones = shapes.filter(s => s.tool === 'zone');

    // Check for triangular passing patterns
    if (this.hasTriangularPattern(lines)) {
      patterns.push({
        name: 'Triangular Passing',
        type: 'passing_pattern',
        confidence: 0.8,
        description: 'Short passing triangles for possession play',
        implications: [
          'High possession retention',
          'Patient build-up play',
          'Requires technical players',
        ],
      });
    }

    // Check for overload patterns
    if (this.hasOverloadPattern(arrows, zones)) {
      patterns.push({
        name: 'Positional Overload',
        type: 'attacking_pattern',
        confidence: 0.7,
        description: 'Numerical superiority in specific areas',
        implications: [
          'Creates advantage in key areas',
          'May leave other areas exposed',
          'Requires coordination',
        ],
      });
    }

    // Check for pressing patterns
    if (this.hasPressingPattern(arrows, zones)) {
      patterns.push({
        name: 'Coordinated Press',
        type: 'defensive_pattern',
        confidence: 0.8,
        description: 'Organized pressing to win ball back',
        implications: [
          'Forces opposition errors',
          'Requires high stamina',
          'Risk if press is broken',
        ],
      });
    }

    return patterns;
  }

  private recognizeCombinedPatterns(
    shapes: DrawingShape[],
    players: Player[],
  ): RecognizedPattern[] {
    const patterns: RecognizedPattern[] = [];

    // Analyze relationship between drawings and player capabilities
    const arrows = shapes.filter(s => s.tool === 'arrow');
    const fastPlayers = players.filter(p => p.attributes.speed > 75);

    // Check if fast players are positioned for counter-attacks
    if (arrows.length > 2 && fastPlayers.length > 3) {
      const forwardArrows = arrows.filter(a => this.calculateArrowDirection(a.points).y > 0.5);
      if (forwardArrows.length > 1) {
        patterns.push({
          name: 'Counter-Attack Setup',
          type: 'tactical_pattern',
          confidence: 0.8,
          description: 'Fast players positioned for quick transitions',
          implications: [
            'Effective against high defensive lines',
            'Requires quick decision making',
            'Vulnerable when caught forward',
          ],
        });
      }
    }

    // Check for technical players in possession areas
    const technicalPlayers = players.filter(p => p.attributes.passing > 80);
    const zones = shapes.filter(s => s.tool === 'zone');
    const centralZones = zones.filter(z => {
      const center = this.calculateZoneCenter(z.points);
      return center.x > 30 && center.x < 70;
    });

    if (technicalPlayers.length > 3 && centralZones.length > 0) {
      patterns.push({
        name: 'Possession Dominance',
        type: 'tactical_pattern',
        confidence: 0.7,
        description: 'Technical players controlling central areas',
        implications: [
          'High possession percentage',
          'Patient build-up play',
          'May struggle against intense pressing',
        ],
      });
    }

    return patterns;
  }

  private generateSmartSuggestions(
    patterns: RecognizedPattern[],
    shapes: DrawingShape[],
    players: Player[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Suggest complementary patterns
    if (patterns.some(p => p.name === 'Wide Formation')) {
      suggestions.push({
        type: 'add_drawing',
        tool: 'arrow',
        description: 'Add crossing arrows from wide areas',
        reasoning: 'Wide formation benefits from crossing opportunities',
        suggestedPositions: this.getWidePosistions(),
      });
    }

    if (patterns.some(p => p.name === 'Compact Formation')) {
      suggestions.push({
        type: 'add_drawing',
        tool: 'line',
        description: 'Add short passing lanes between close players',
        reasoning: 'Compact formations excel at short passing combinations',
        suggestedPositions: this.getCompactPassingLanes(shapes),
      });
    }

    // Suggest based on player attributes
    const fastPlayers = players.filter(p => p.attributes.speed > 80);
    if (fastPlayers.length > 2 && !patterns.some(p => p.type === 'transition_pattern')) {
      suggestions.push({
        type: 'tactical_adjustment',
        tool: 'arrow',
        description: 'Utilize pace for counter-attacking runs',
        reasoning: 'Multiple fast players can create transition opportunities',
        suggestedPositions: this.getCounterAttackPositions(fastPlayers),
      });
    }

    // Suggest defensive improvements
    if (!patterns.some(p => p.type === 'defensive_pattern')) {
      suggestions.push({
        type: 'add_drawing',
        tool: 'zone',
        description: 'Mark pressing zones to improve defensive coordination',
        reasoning: 'No defensive patterns detected - add structured pressing',
        suggestedPositions: this.getPressingZones(),
      });
    }

    return suggestions;
  }

  private suggestImprovements(
    patterns: RecognizedPattern[],
    shapes: DrawingShape[],
  ): Improvement[] {
    const improvements: Improvement[] = [];

    // Analyze pattern conflicts
    const conflicts = this.findPatternConflicts(patterns);
    conflicts.forEach(conflict => {
      improvements.push({
        type: 'resolve_conflict',
        priority: 'high',
        description: conflict.description,
        solution: conflict.solution,
      });
    });

    // Suggest missing elements
    if (
      patterns.some(p => p.name === 'Counter-Attack Setup') &&
      !shapes.some(s => s.tool === 'zone')
    ) {
      improvements.push({
        type: 'add_element',
        priority: 'medium',
        description: 'Add defensive zones to show compact defending',
        solution: 'Mark areas where team defends compactly before transitioning',
      });
    }

    // Suggest tactical enhancements
    if (patterns.length < 2) {
      improvements.push({
        type: 'enhance_tactics',
        priority: 'medium',
        description: 'Add more tactical depth to the plan',
        solution: 'Include both offensive and defensive phases in the drawing',
      });
    }

    return improvements;
  }

  private calculateCompactness(positions: { x: number; y: number }[]): number {
    if (positions.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    let pairs = 0;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const distance = Math.sqrt(
          Math.pow(positions[i].x - positions[j].x, 2) +
            Math.pow(positions[i].y - positions[j].y, 2),
        );
        totalDistance += distance;
        pairs++;
      }
    }

    return pairs > 0 ? totalDistance / pairs : 0;
  }

  private calculateWidth(positions: { x: number; y: number }[]): number {
    if (positions.length === 0) {
      return 0;
    }

    const xPositions = positions.map(p => p.x);
    return Math.max(...xPositions) - Math.min(...xPositions);
  }

  private calculateDepth(positions: { x: number; y: number }[]): number {
    if (positions.length === 0) {
      return 0;
    }

    const yPositions = positions.map(p => p.y);
    return Math.max(...yPositions) - Math.min(...yPositions);
  }

  private hasTriangularPattern(lines: DrawingShape[]): boolean {
    // Simplified check for triangular passing patterns
    return lines.length >= 3 && lines.some(line => line.points && line.points.length > 0);
  }

  private hasOverloadPattern(arrows: DrawingShape[], zones: DrawingShape[]): boolean {
    // Check if multiple arrows converge on zones
    return arrows.length > 2 && zones.length > 0;
  }

  private hasPressingPattern(arrows: DrawingShape[], zones: DrawingShape[]): boolean {
    // Check for coordinated movement towards specific zones
    const convergingArrows = arrows.filter(arrow => {
      const direction = this.calculateArrowDirection(arrow.points);
      return Math.abs(direction.y) < 0.5; // Horizontal movement for pressing
    });

    return convergingArrows.length > 1 && zones.length > 0;
  }

  private calculateArrowDirection(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length < 2) {
      return { x: 0, y: 0 };
    }

    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  private calculateZoneCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const totalX = points.reduce((sum, p) => sum + p.x, 0);
    const totalY = points.reduce((sum, p) => sum + p.y, 0);

    return {
      x: totalX / points.length,
      y: totalY / points.length,
    };
  }

  private calculateOverallConfidence(patterns: RecognizedPattern[]): number {
    if (patterns.length === 0) {
      return 0;
    }

    const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
    return totalConfidence / patterns.length;
  }

  private findPatternConflicts(patterns: RecognizedPattern[]): PatternConflict[] {
    const conflicts: PatternConflict[] = [];

    // Check for conflicting tactical approaches
    const hasWidePlay = patterns.some(p => p.name === 'Wide Formation');
    const hasCompactPlay = patterns.some(p => p.name === 'Compact Formation');

    if (hasWidePlay && hasCompactPlay) {
      conflicts.push({
        description: 'Conflicting width strategies detected',
        solution: 'Choose either wide spread or compact positioning based on tactical objective',
      });
    }

    const hasCounterAttack = patterns.some(p => p.name === 'Counter-Attack Setup');
    const hasPossession = patterns.some(p => p.name === 'Possession Dominance');

    if (hasCounterAttack && hasPossession) {
      conflicts.push({
        description: 'Mixed possession and counter-attack approaches',
        solution: 'Define clear phases: when to keep possession vs when to transition quickly',
      });
    }

    return conflicts;
  }

  private getWidePosistions(): { x: number; y: number }[] {
    return [
      { x: 10, y: 50 }, // Left wing
      { x: 90, y: 50 }, // Right wing
      { x: 15, y: 70 }, // Left attacking position
      { x: 85, y: 70 }, // Right attacking position
    ];
  }

  private getCompactPassingLanes(shapes: DrawingShape[]): { x: number; y: number }[] {
    // Generate positions between existing shapes for short passing
    const existingPositions = shapes.flatMap(s => s.points);
    if (existingPositions.length < 2) {
      return [{ x: 50, y: 50 }];
    }

    const lanes: { x: number; y: number }[] = [];
    for (let i = 0; i < existingPositions.length - 1; i++) {
      const midpoint = {
        x: (existingPositions[i].x + existingPositions[i + 1].x) / 2,
        y: (existingPositions[i].y + existingPositions[i + 1].y) / 2,
      };
      lanes.push(midpoint);
    }

    return lanes;
  }

  private getCounterAttackPositions(fastPlayers: Player[]): { x: number; y: number }[] {
    // Suggest positions for fast counter-attacks
    return [
      { x: 30, y: 80 }, // Left forward run
      { x: 70, y: 80 }, // Right forward run
      { x: 50, y: 85 }, // Central penetration
      { x: 20, y: 75 }, // Wide left
      { x: 80, y: 75 }, // Wide right
    ];
  }

  private getPressingZones(): { x: number; y: number }[] {
    return [
      { x: 50, y: 40 }, // Central pressing zone
      { x: 30, y: 35 }, // Left pressing zone
      { x: 70, y: 35 }, // Right pressing zone
    ];
  }
}

// Smart annotation system
class SmartAnnotationEngine {
  /**
   * Generate intelligent annotations for tactical drawings
   */
  generateSmartAnnotations(
    shapes: DrawingShape[],
    players: Player[],
    recognizedPatterns: RecognizedPattern[],
  ): SmartAnnotation[] {
    const annotations: SmartAnnotation[] = [];

    // Annotate key tactical areas
    annotations.push(...this.annotateKeyAreas(shapes));

    // Annotate player movements
    annotations.push(...this.annotatePlayerMovements(shapes, players));

    // Annotate tactical patterns
    annotations.push(...this.annotatePatterns(recognizedPatterns));

    // Add timing and sequence annotations
    annotations.push(...this.annotateSequence(shapes));

    return annotations;
  }

  private annotateKeyAreas(shapes: DrawingShape[]): SmartAnnotation[] {
    const annotations: SmartAnnotation[] = [];

    shapes.forEach((shape, index) => {
      switch (shape.tool) {
        case 'zone':
          const center = this.calculateZoneCenter(shape.points);
          annotations.push({
            id: `zone_${index}`,
            position: center,
            text: this.generateZoneAnnotation(shape, center),
            type: 'zone_description',
            priority: 'medium',
          });
          break;

        case 'arrow':
          const arrowCenter = this.calculateArrowCenter(shape.points);
          annotations.push({
            id: `movement_${index}`,
            position: arrowCenter,
            text: this.generateMovementAnnotation(shape),
            type: 'movement_description',
            priority: 'high',
          });
          break;

        case 'line':
          const lineCenter = this.calculateLineCenter(shape.points);
          annotations.push({
            id: `passing_${index}`,
            position: lineCenter,
            text: this.generatePassingAnnotation(shape),
            type: 'passing_description',
            priority: 'medium',
          });
          break;
      }
    });

    return annotations;
  }

  private annotatePlayerMovements(shapes: DrawingShape[], players: Player[]): SmartAnnotation[] {
    const annotations: SmartAnnotation[] = [];
    const arrows = shapes.filter(s => s.tool === 'arrow');

    arrows.forEach((arrow, index) => {
      // Find nearest player to arrow start
      const nearestPlayer = this.findNearestPlayer(arrow.points[0], players);
      if (nearestPlayer) {
        const annotation = this.generatePlayerMovementAnnotation(nearestPlayer, arrow);
        annotations.push({
          id: `player_movement_${index}`,
          position: arrow.points[0],
          text: annotation,
          type: 'player_instruction',
          priority: 'high',
        });
      }
    });

    return annotations;
  }

  private annotatePatterns(patterns: RecognizedPattern[]): SmartAnnotation[] {
    const annotations: SmartAnnotation[] = [];

    patterns.forEach((pattern, index) => {
      annotations.push({
        id: `pattern_${index}`,
        position: { x: 10, y: 10 + index * 20 }, // Position in corner
        text: `${pattern.name}: ${pattern.description}`,
        type: 'pattern_explanation',
        priority: 'high',
      });
    });

    return annotations;
  }

  private annotateSequence(shapes: DrawingShape[]): SmartAnnotation[] {
    const annotations: SmartAnnotation[] = [];

    // Sort shapes by timestamp to determine sequence
    const sortedShapes = [...shapes].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    sortedShapes.forEach((shape, index) => {
      if (index > 0) {
        const sequenceNumber = index;
        const position = shape.points[0];

        annotations.push({
          id: `sequence_${index}`,
          position,
          text: `${sequenceNumber}`,
          type: 'sequence_number',
          priority: 'low',
        });
      }
    });

    return annotations;
  }

  private generateZoneAnnotation(shape: DrawingShape, center: { x: number; y: number }): string {
    if (center.y < 30) {
      return 'Defensive Zone - Compact defending';
    } else if (center.y > 70) {
      return 'Attacking Zone - Create chances';
    } else {
      return 'Midfield Zone - Control tempo';
    }
  }

  private generateMovementAnnotation(shape: DrawingShape): string {
    const direction = this.calculateArrowDirection(shape.points);

    if (direction.y > 0.7) {
      return 'Forward run - Penetrate defense';
    } else if (direction.y < -0.5) {
      return 'Recovery run - Track back';
    } else if (Math.abs(direction.x) > 0.8) {
      return 'Wide run - Create width';
    } else {
      return 'Positional movement';
    }
  }

  private generatePassingAnnotation(shape: DrawingShape): string {
    const length = this.calculateLineLength(shape.points);

    if (length > 30) {
      return 'Long pass - Switch play';
    } else if (length > 15) {
      return 'Medium pass - Progress forward';
    } else {
      return 'Short pass - Maintain possession';
    }
  }

  private generatePlayerMovementAnnotation(player: Player, arrow: DrawingShape): string {
    const direction = this.calculateArrowDirection(arrow.points);
    const playerRole = player.roleId;

    if (playerRole.includes('FW') && direction.y > 0.5) {
      return `${player.name}: Make run in behind`;
    } else if (playerRole.includes('MF') && Math.abs(direction.x) > 0.6) {
      return `${player.name}: Provide width`;
    } else if (playerRole.includes('DF') && direction.y < -0.3) {
      return `${player.name}: Track defensive duties`;
    } else {
      return `${player.name}: Support play`;
    }
  }

  private findNearestPlayer(position: { x: number; y: number }, players: Player[]): Player | null {
    let nearest: Player | null = null;
    let minDistance = Infinity;

    players.forEach(player => {
      const distance = Math.sqrt(
        Math.pow(player.position.x - position.x, 2) + Math.pow(player.position.y - position.y, 2),
      );

      if (distance < minDistance && distance < 20) {
        // Within reasonable range
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  private calculateZoneCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const totalX = points.reduce((sum, p) => sum + p.x, 0);
    const totalY = points.reduce((sum, p) => sum + p.y, 0);

    return {
      x: totalX / points.length,
      y: totalY / points.length,
    };
  }

  private calculateArrowCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    // Return midpoint of arrow
    const start = points[0];
    const end = points[points.length - 1];

    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  }

  private calculateLineCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    return this.calculateArrowCenter(points); // Same calculation
  }

  private calculateArrowDirection(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length < 2) {
      return { x: 0, y: 0 };
    }

    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  private calculateLineLength(points: readonly { x: number; y: number }[]): number {
    if (points.length < 2) {
      return 0;
    }

    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    return totalLength;
  }
}

// Main AI Drawing Intelligence Service
export class AIDrawingIntelligenceService {
  private geometricAnalyzer: GeometricAnalyzer;
  private tacticalPatternRecognizer: TacticalPatternRecognizer;
  private smartAnnotationEngine: SmartAnnotationEngine;

  constructor() {
    this.geometricAnalyzer = new GeometricAnalyzer();
    this.tacticalPatternRecognizer = new TacticalPatternRecognizer();
    this.smartAnnotationEngine = new SmartAnnotationEngine();
  }

  /**
   * Analyze tactical drawings and provide intelligent suggestions
   */
  async analyzeDrawings(
    shapes: DrawingShape[],
    players: Player[],
    formation: Formation,
  ): Promise<DrawingAnalysis> {
    const geometricPatterns = this.geometricAnalyzer.analyzeGeometricPatterns(shapes);
    const tacticalRecognition = this.tacticalPatternRecognizer.recognizePatterns(
      shapes,
      players,
      formation,
    );
    const smartAnnotations = this.smartAnnotationEngine.generateSmartAnnotations(
      shapes,
      players,
      tacticalRecognition.patterns,
    );

    return {
      geometricPatterns,
      tacticalRecognition,
      smartAnnotations,
      overallScore: this.calculateOverallAnalysisScore(geometricPatterns, tacticalRecognition),
      recommendations: this.generateOverallRecommendations(geometricPatterns, tacticalRecognition),
    };
  }

  /**
   * Get smart drawing suggestions based on current context
   */
  async getSmartSuggestions(
    currentShapes: DrawingShape[],
    players: Player[],
    formation: Formation,
    tacticalObjective: TacticalObjective,
  ): Promise<DrawingSuggestion[]> {
    const suggestions: DrawingSuggestion[] = [];

    // Analyze what's missing for the tactical objective
    const missingElements = this.identifyMissingElements(currentShapes, tacticalObjective);

    missingElements.forEach(element => {
      suggestions.push({
        tool: element.suggestedTool,
        description: element.description,
        reasoning: element.reasoning,
        priority: element.priority,
        suggestedPositions: element.positions,
        expectedOutcome: element.expectedOutcome,
      });
    });

    // Add player-specific suggestions
    const playerSuggestions = this.generatePlayerSpecificSuggestions(players, currentShapes);
    suggestions.push(...playerSuggestions);

    return suggestions.sort(
      (a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority),
    );
  }

  /**
   * Validate tactical drawings for consistency and effectiveness
   */
  async validateDrawings(
    shapes: DrawingShape[],
    players: Player[],
    formation: Formation,
  ): Promise<DrawingValidation> {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for tactical inconsistencies
    const inconsistencies = this.findTacticalInconsistencies(shapes, players, formation);
    issues.push(...inconsistencies);

    // Check for missing critical elements
    const missingElements = this.findMissingCriticalElements(shapes, formation);
    warnings.push(...missingElements);

    // Check for overcomplicated drawings
    const complexityWarnings = this.checkComplexity(shapes);
    warnings.push(...complexityWarnings);

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score: this.calculateValidationScore(issues, warnings),
      suggestions: this.generateValidationSuggestions(issues, warnings),
    };
  }

  private calculateOverallAnalysisScore(
    geometricPatterns: GeometricPattern[],
    tacticalRecognition: TacticalRecognition,
  ): number {
    const geometricScore =
      geometricPatterns.reduce((sum, p) => sum + p.confidence, 0) / geometricPatterns.length || 0;
    const tacticalScore = tacticalRecognition.confidence;

    return (geometricScore + tacticalScore) / 2;
  }

  private generateOverallRecommendations(
    geometricPatterns: GeometricPattern[],
    tacticalRecognition: TacticalRecognition,
  ): string[] {
    const recommendations: string[] = [];

    if (geometricPatterns.length < 3) {
      recommendations.push('Add more tactical elements to increase drawing complexity');
    }

    if (tacticalRecognition.confidence < 0.6) {
      recommendations.push('Clarify tactical intentions with more specific drawings');
    }

    if (tacticalRecognition.improvements.length > 0) {
      recommendations.push(
        `Address ${tacticalRecognition.improvements.length} identified improvements`,
      );
    }

    return recommendations;
  }

  private identifyMissingElements(
    shapes: DrawingShape[],
    objective: TacticalObjective,
  ): MissingElement[] {
    const missing: MissingElement[] = [];

    switch (objective) {
      case 'attacking':
        if (!shapes.some(s => s.tool === 'arrow')) {
          missing.push({
            suggestedTool: 'arrow',
            description: 'Add attacking movement arrows',
            reasoning: 'Attacking objectives require clear player movement patterns',
            priority: 'high',
            positions: [
              { x: 50, y: 70 },
              { x: 30, y: 75 },
              { x: 70, y: 75 },
            ],
            expectedOutcome: 'Shows how players create attacking threats',
          });
        }
        break;

      case 'defensive':
        if (!shapes.some(s => s.tool === 'zone')) {
          missing.push({
            suggestedTool: 'zone',
            description: 'Mark defensive zones',
            reasoning: 'Defensive play requires clear area responsibilities',
            priority: 'high',
            positions: [
              { x: 50, y: 30 },
              { x: 30, y: 25 },
              { x: 70, y: 25 },
            ],
            expectedOutcome: 'Defines defensive coverage areas',
          });
        }
        break;

      case 'transition':
        if (!shapes.some(s => s.tool === 'arrow') || !shapes.some(s => s.tool === 'line')) {
          missing.push({
            suggestedTool: 'arrow',
            description: 'Add transition movement and passing',
            reasoning: 'Transitions require both movement and passing elements',
            priority: 'medium',
            positions: [
              { x: 40, y: 50 },
              { x: 60, y: 60 },
            ],
            expectedOutcome: 'Shows quick transition from defense to attack',
          });
        }
        break;
    }

    return missing;
  }

  private generatePlayerSpecificSuggestions(
    players: Player[],
    currentShapes: DrawingShape[],
  ): DrawingSuggestion[] {
    const suggestions: DrawingSuggestion[] = [];

    // Suggest movements for fast players
    const fastPlayers = players.filter(p => p.attributes.speed > 80);
    if (fastPlayers.length > 0 && !currentShapes.some(s => s.tool === 'arrow')) {
      suggestions.push({
        tool: 'arrow',
        description: 'Add speed-based attacking runs',
        reasoning: `${fastPlayers.length} fast players can exploit space with pace`,
        priority: 'medium',
        suggestedPositions: fastPlayers.map(p => ({ x: p.position.x + 10, y: p.position.y + 20 })),
        expectedOutcome: 'Utilizes pace advantage for creating chances',
      });
    }

    // Suggest passing lanes for technical players
    const technicalPlayers = players.filter(p => p.attributes.passing > 80);
    if (technicalPlayers.length > 2 && !currentShapes.some(s => s.tool === 'line')) {
      suggestions.push({
        tool: 'line',
        description: 'Connect technical players with passing lanes',
        reasoning: 'High passing ability players can maintain possession effectively',
        priority: 'medium',
        suggestedPositions: this.generatePassingLanePositions(technicalPlayers),
        expectedOutcome: 'Improves ball circulation and possession',
      });
    }

    return suggestions;
  }

  private generatePassingLanePositions(players: Player[]): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < players.length - 1; i++) {
      const start = players[i].position;
      const end = players[i + 1].position;

      positions.push(start, end);
    }

    return positions;
  }

  private findTacticalInconsistencies(
    shapes: DrawingShape[],
    players: Player[],
    formation: Formation,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if movements conflict with player abilities
    const arrows = shapes.filter(s => s.tool === 'arrow');
    arrows.forEach(arrow => {
      const nearestPlayer = this.findNearestPlayer(arrow.points[0], players);
      if (nearestPlayer) {
        const direction = this.calculateArrowDirection(arrow.points);
        if (direction.y > 0.8 && nearestPlayer.attributes.speed < 60) {
          issues.push({
            type: 'ability_mismatch',
            severity: 'medium',
            description: `Slow player (${nearestPlayer.name}) assigned fast attacking run`,
            suggestion: 'Use faster players for penetrating runs or adjust movement pattern',
          });
        }
      }
    });

    return issues;
  }

  private findMissingCriticalElements(
    shapes: DrawingShape[],
    formation: Formation,
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (shapes.length === 0) {
      warnings.push({
        type: 'missing_elements',
        description: 'No tactical drawings present',
        impact: 'Players lack clear tactical instructions',
      });
    }

    const hasDefensiveElements = shapes.some(
      s => s.tool === 'zone' && this.calculateZoneCenter(s.points).y < 50,
    );

    if (!hasDefensiveElements) {
      warnings.push({
        type: 'missing_defensive',
        description: 'No defensive tactical elements',
        impact: 'Unclear defensive organization',
      });
    }

    return warnings;
  }

  private checkComplexity(shapes: DrawingShape[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (shapes.length > 15) {
      warnings.push({
        type: 'overcomplicated',
        description: 'Too many tactical elements may confuse players',
        impact: 'Players may struggle to execute complex instructions',
      });
    }

    return warnings;
  }

  private calculateValidationScore(
    issues: ValidationIssue[],
    warnings: ValidationWarning[],
  ): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    warnings.forEach(() => {
      score -= 3;
    });

    return Math.max(0, score);
  }

  private generateValidationSuggestions(
    issues: ValidationIssue[],
    warnings: ValidationWarning[],
  ): string[] {
    const suggestions: string[] = [];

    issues.forEach(issue => {
      suggestions.push(issue.suggestion);
    });

    if (warnings.some(w => w.type === 'missing_elements')) {
      suggestions.push('Add basic tactical elements to provide player guidance');
    }

    if (warnings.some(w => w.type === 'overcomplicated')) {
      suggestions.push('Simplify tactical instructions for better execution');
    }

    return suggestions;
  }

  private findNearestPlayer(position: { x: number; y: number }, players: Player[]): Player | null {
    let nearest: Player | null = null;
    let minDistance = Infinity;

    players.forEach(player => {
      const distance = Math.sqrt(
        Math.pow(player.position.x - position.x, 2) + Math.pow(player.position.y - position.y, 2),
      );

      if (distance < minDistance && distance < 20) {
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  private calculateArrowDirection(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length < 2) {
      return { x: 0, y: 0 };
    }

    const start = points[0];
    const end = points[points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  private calculateZoneCenter(points: readonly { x: number; y: number }[]): {
    x: number;
    y: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const totalX = points.reduce((sum, p) => sum + p.x, 0);
    const totalY = points.reduce((sum, p) => sum + p.y, 0);

    return {
      x: totalX / points.length,
      y: totalY / points.length,
    };
  }

  private getPriorityValue(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }
}

// Type definitions
export interface GeometricPattern {
  type: string;
  shape: DrawingShape;
  confidence: number;
  description: string;
  tacticalImplication: string;
}

export interface TacticalPattern {
  name: string;
  type: string;
  characteristics: Record<string, boolean>;
  requirements: string[];
}

export interface RecognizedPattern {
  name: string;
  type: string;
  confidence: number;
  description: string;
  implications: string[];
}

export interface SmartSuggestion {
  type: 'add_drawing' | 'tactical_adjustment' | 'formation_change';
  tool: DrawingTool;
  description: string;
  reasoning: string;
  suggestedPositions: { x: number; y: number }[];
}

export interface Improvement {
  type: 'resolve_conflict' | 'add_element' | 'enhance_tactics';
  priority: 'low' | 'medium' | 'high';
  description: string;
  solution: string;
}

export interface TacticalRecognition {
  patterns: RecognizedPattern[];
  suggestions: SmartSuggestion[];
  improvements: Improvement[];
  confidence: number;
}

export interface SmartAnnotation {
  id: string;
  position: { x: number; y: number };
  text: string;
  type:
    | 'zone_description'
    | 'movement_description'
    | 'passing_description'
    | 'player_instruction'
    | 'pattern_explanation'
    | 'sequence_number';
  priority: 'low' | 'medium' | 'high';
}

export interface DrawingAnalysis {
  geometricPatterns: GeometricPattern[];
  tacticalRecognition: TacticalRecognition;
  smartAnnotations: SmartAnnotation[];
  overallScore: number;
  recommendations: string[];
}

export interface DrawingSuggestion {
  tool: DrawingTool;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  suggestedPositions: { x: number; y: number }[];
  expectedOutcome: string;
}

export interface ValidationIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface ValidationWarning {
  type: string;
  description: string;
  impact: string;
}

export interface DrawingValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  score: number;
  suggestions: string[];
}

export type TacticalObjective = 'attacking' | 'defensive' | 'transition' | 'possession';

interface PatternConflict {
  description: string;
  solution: string;
}

interface MissingElement {
  suggestedTool: DrawingTool;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  positions: { x: number; y: number }[];
  expectedOutcome: string;
}

// Export singleton instance
export const aiDrawingIntelligence = new AIDrawingIntelligenceService();
