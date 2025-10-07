import { useCallback, useState, useRef, useEffect } from 'react';
import { useMotionValue, useAnimation, PanInfo } from 'framer-motion';

/**
 * Grid configuration for snap-to-grid functionality
 */
export interface GridConfig {
  enabled: boolean;
  size: number; // Grid size in percentage (e.g., 5 = 5% grid)
  snapThreshold: number; // Distance threshold for snapping (in percentage)
  showGridLines?: boolean;
}

/**
 * Collision detection configuration
 */
export interface CollisionConfig {
  enabled: boolean;
  minDistance: number; // Minimum distance between players (in percentage)
  preventOverlap: boolean; // Prevent dragging into occupied spaces
  showWarnings?: boolean; // Show visual warnings for collisions
}

/**
 * Auto-alignment configuration
 */
export interface AlignmentConfig {
  enabled: boolean;
  snapToFormationSlots: boolean; // Snap to predefined formation positions
  snapToTacticalZones: boolean; // Snap to tactical zone boundaries
  snapToPlayers: boolean; // Snap to align with nearby players
  alignmentThreshold: number; // Distance threshold for alignment (in percentage)
}

/**
 * Boundary constraints for dragging
 */
export interface BoundaryConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  enforceFieldBoundaries: boolean;
}

/**
 * Position interface
 */
export interface Position {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

/**
 * Player collision data
 */
export interface PlayerCollision {
  id: string;
  position: Position;
  radius: number; // Collision radius in percentage
}

/**
 * Formation slot data
 */
export interface FormationSlot {
  id: string;
  position: Position;
  role: string;
  occupied: boolean;
}

/**
 * Tactical zone data
 */
export interface TacticalZone {
  id: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  snapPoints?: Position[];
}

/**
 * Drag result interface
 */
export interface DragResult {
  finalPosition: Position;
  snapped: boolean;
  snapType?: 'grid' | 'formation' | 'zone' | 'player';
  snapTarget?: string;
  collisions: string[];
}

/**
 * Hook configuration
 */
export interface UseDragAndDropOptions {
  initialPosition: Position;
  grid?: GridConfig;
  collision?: CollisionConfig;
  alignment?: AlignmentConfig;
  boundary?: BoundaryConfig;
  otherPlayers?: PlayerCollision[];
  formationSlots?: FormationSlot[];
  tacticalZones?: TacticalZone[];
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position, info: DragResult) => void;
  onDragEnd?: (result: DragResult) => void;
}

/**
 * Default configurations
 */
const DEFAULT_GRID: GridConfig = {
  enabled: true,
  size: 5,
  snapThreshold: 2.5,
  showGridLines: false,
};

const DEFAULT_COLLISION: CollisionConfig = {
  enabled: true,
  minDistance: 3,
  preventOverlap: true,
  showWarnings: true,
};

const DEFAULT_ALIGNMENT: AlignmentConfig = {
  enabled: true,
  snapToFormationSlots: true,
  snapToTacticalZones: true,
  snapToPlayers: true,
  alignmentThreshold: 4,
};

const DEFAULT_BOUNDARY: BoundaryConfig = {
  minX: 2,
  maxX: 98,
  minY: 2,
  maxY: 98,
  enforceFieldBoundaries: true,
};

/**
 * Advanced drag-and-drop hook with collision detection, snap-to-grid, and auto-alignment
 *
 * @example
 * ```typescript
 * const {
 *   position,
 *   isDragging,
 *   dragControls,
 *   handleDragStart,
 *   handleDrag,
 *   handleDragEnd,
 *   collisions,
 *   snapInfo
 * } = useDragAndDrop({
 *   initialPosition: { x: 50, y: 50 },
 *   grid: { enabled: true, size: 5 },
 *   collision: { enabled: true, minDistance: 3 },
 *   otherPlayers: otherPlayerPositions
 * });
 * ```
 */
export function useDragAndDrop(options: UseDragAndDropOptions) {
  const {
    initialPosition,
    grid = DEFAULT_GRID,
    collision = DEFAULT_COLLISION,
    alignment = DEFAULT_ALIGNMENT,
    boundary = DEFAULT_BOUNDARY,
    otherPlayers = [],
    formationSlots = [],
    tacticalZones = [],
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  // State
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [collisions, setCollisions] = useState<string[]>([]);
  const [snapInfo, setSnapInfo] = useState<{ type?: string; target?: string } | null>(null);

  // Refs
  const dragStartPosition = useRef<Position>(initialPosition);
  const lastValidPosition = useRef<Position>(initialPosition);

  // Motion values
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  const controls = useAnimation();

  /**
   * Calculate distance between two positions
   */
  const getDistance = useCallback((pos1: Position, pos2: Position): number => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Snap position to grid
   */
  const snapToGrid = useCallback(
    (pos: Position): Position => {
      if (!grid.enabled) {
        return pos;
      }

      const snappedX = Math.round(pos.x / grid.size) * grid.size;
      const snappedY = Math.round(pos.y / grid.size) * grid.size;

      const distanceToSnap = getDistance(pos, { x: snappedX, y: snappedY });

      if (distanceToSnap <= grid.snapThreshold) {
        return { x: snappedX, y: snappedY };
      }

      return pos;
    },
    [grid, getDistance],
  );

  /**
   * Find nearest formation slot
   */
  const findNearestFormationSlot = useCallback(
    (pos: Position): FormationSlot | null => {
      if (!alignment.enabled || !alignment.snapToFormationSlots) {
        return null;
      }

      const availableSlots = formationSlots.filter(slot => !slot.occupied);
      if (availableSlots.length === 0) {
        return null;
      }

      let nearestSlot: FormationSlot | null = null;
      let minDistance = Infinity;

      for (const slot of availableSlots) {
        const distance = getDistance(pos, slot.position);
        if (distance < minDistance && distance <= alignment.alignmentThreshold) {
          minDistance = distance;
          nearestSlot = slot;
        }
      }

      return nearestSlot;
    },
    [alignment, formationSlots, getDistance],
  );

  /**
   * Find nearest tactical zone snap point
   */
  const findNearestZoneSnapPoint = useCallback(
    (pos: Position): { zone: TacticalZone; snapPoint: Position } | null => {
      if (!alignment.enabled || !alignment.snapToTacticalZones) {
        return null;
      }

      let nearestSnap: { zone: TacticalZone; snapPoint: Position } | null = null;
      let minDistance = Infinity;

      for (const zone of tacticalZones) {
        if (!zone.snapPoints || zone.snapPoints.length === 0) {
          continue;
        }

        for (const snapPoint of zone.snapPoints) {
          const distance = getDistance(pos, snapPoint);
          if (distance < minDistance && distance <= alignment.alignmentThreshold) {
            minDistance = distance;
            nearestSnap = { zone, snapPoint };
          }
        }
      }

      return nearestSnap;
    },
    [alignment, tacticalZones, getDistance],
  );

  /**
   * Find nearest player for alignment
   */
  const findNearestPlayerAlignment = useCallback(
    (pos: Position): { player: PlayerCollision; alignedPosition: Position } | null => {
      if (!alignment.enabled || !alignment.snapToPlayers || otherPlayers.length === 0) {
        return null;
      }

      let nearestAlignment: { player: PlayerCollision; alignedPosition: Position } | null = null;
      let minDistance = Infinity;

      for (const player of otherPlayers) {
        // Check for horizontal alignment
        if (Math.abs(pos.y - player.position.y) <= alignment.alignmentThreshold) {
          const distance = Math.abs(pos.y - player.position.y);
          if (distance < minDistance) {
            minDistance = distance;
            nearestAlignment = {
              player,
              alignedPosition: { x: pos.x, y: player.position.y },
            };
          }
        }

        // Check for vertical alignment
        if (Math.abs(pos.x - player.position.x) <= alignment.alignmentThreshold) {
          const distance = Math.abs(pos.x - player.position.x);
          if (distance < minDistance) {
            minDistance = distance;
            nearestAlignment = {
              player,
              alignedPosition: { x: player.position.x, y: pos.y },
            };
          }
        }
      }

      return nearestAlignment;
    },
    [alignment, otherPlayers],
  );

  /**
   * Detect collisions with other players
   */
  const detectCollisions = useCallback(
    (pos: Position): string[] => {
      if (!collision.enabled) {
        return [];
      }

      const collidingPlayers: string[] = [];

      for (const player of otherPlayers) {
        const distance = getDistance(pos, player.position);
        const minAllowedDistance = collision.minDistance + player.radius;

        if (distance < minAllowedDistance) {
          collidingPlayers.push(player.id);
        }
      }

      return collidingPlayers;
    },
    [collision, otherPlayers, getDistance],
  );

  /**
   * Apply boundary constraints
   */
  const applyBoundaryConstraints = useCallback(
    (pos: Position): Position => {
      if (!boundary.enforceFieldBoundaries) {
        return pos;
      }

      return {
        x: Math.max(boundary.minX, Math.min(boundary.maxX, pos.x)),
        y: Math.max(boundary.minY, Math.min(boundary.maxY, pos.y)),
      };
    },
    [boundary],
  );

  /**
   * Calculate final position with all constraints and snapping
   */
  const calculateFinalPosition = useCallback(
    (rawPos: Position): DragResult => {
      // Apply boundary constraints first
      let finalPos = applyBoundaryConstraints(rawPos);

      let snapped = false;
      let snapType: DragResult['snapType'];
      let snapTarget: string | undefined;

      // Check formation slot snapping (highest priority)
      const nearestSlot = findNearestFormationSlot(finalPos);
      if (nearestSlot) {
        finalPos = nearestSlot.position;
        snapped = true;
        snapType = 'formation';
        snapTarget = nearestSlot.id;
      }
      // Check tactical zone snapping
      else {
        const nearestZoneSnap = findNearestZoneSnapPoint(finalPos);
        if (nearestZoneSnap) {
          finalPos = nearestZoneSnap.snapPoint;
          snapped = true;
          snapType = 'zone';
          snapTarget = nearestZoneSnap.zone.id;
        }
        // Check player alignment
        else {
          const playerAlignment = findNearestPlayerAlignment(finalPos);
          if (playerAlignment) {
            finalPos = playerAlignment.alignedPosition;
            snapped = true;
            snapType = 'player';
            snapTarget = playerAlignment.player.id;
          }
          // Finally, try grid snapping
          else {
            const gridSnapped = snapToGrid(finalPos);
            if (gridSnapped.x !== finalPos.x || gridSnapped.y !== finalPos.y) {
              finalPos = gridSnapped;
              snapped = true;
              snapType = 'grid';
            }
          }
        }
      }

      // Detect collisions
      const detectedCollisions = detectCollisions(finalPos);

      // If collisions are detected and prevention is enabled, revert to last valid position
      if (collision.preventOverlap && detectedCollisions.length > 0) {
        finalPos = lastValidPosition.current;
      } else {
        lastValidPosition.current = finalPos;
      }

      return {
        finalPosition: finalPos,
        snapped,
        snapType,
        snapTarget,
        collisions: detectedCollisions,
      };
    },
    [
      applyBoundaryConstraints,
      findNearestFormationSlot,
      findNearestZoneSnapPoint,
      findNearestPlayerAlignment,
      snapToGrid,
      detectCollisions,
      collision.preventOverlap,
    ],
  );

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(true);
      dragStartPosition.current = position;

      if (onDragStart) {
        onDragStart(position);
      }
    },
    [position, onDragStart],
  );

  /**
   * Handle drag
   */
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Calculate new position based on drag offset
      // Note: This assumes the parent container is the field (0-100% scale)
      const newPos: Position = {
        x: position.x + info.delta.x * 0.1, // Adjust scaling factor as needed
        y: position.y + info.delta.y * 0.1,
      };

      const result = calculateFinalPosition(newPos);

      setPosition(result.finalPosition);
      setCollisions(result.collisions);
      setSnapInfo(result.snapped ? { type: result.snapType, target: result.snapTarget } : null);

      if (onDrag) {
        onDrag(result.finalPosition, result);
      }
    },
    [position, calculateFinalPosition, onDrag],
  );

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const result = calculateFinalPosition(position);

      // Animate to final position with spring physics
      controls.start({
        x: result.finalPosition.x,
        y: result.finalPosition.y,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 30,
        },
      });

      setPosition(result.finalPosition);
      setCollisions(result.collisions);
      setSnapInfo(result.snapped ? { type: result.snapType, target: result.snapTarget } : null);

      if (onDragEnd) {
        onDragEnd(result);
      }
    },
    [position, calculateFinalPosition, controls, onDragEnd],
  );

  /**
   * Update position when initialPosition changes
   */
  useEffect(() => {
    setPosition(initialPosition);
    lastValidPosition.current = initialPosition;
  }, [initialPosition]);

  return {
    // Position state
    position,
    isDragging,
    collisions,
    snapInfo,

    // Motion values
    x,
    y,
    controls,

    // Drag handlers
    handleDragStart,
    handleDrag,
    handleDragEnd,

    // Utility functions
    snapToGrid,
    detectCollisions,
    calculateFinalPosition,
  };
}
