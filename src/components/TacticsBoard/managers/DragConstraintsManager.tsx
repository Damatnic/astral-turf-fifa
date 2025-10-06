import React, { useMemo } from 'react';
import {
  SnapIndicator,
  CollisionWarning,
  AlignmentGuide,
  GridOverlay,
  FormationSlotIndicators,
} from '../indicators/DragIndicators';
import type {
  Position,
  FormationSlot,
  TacticalZone,
  PlayerCollision,
} from '../../../hooks/useDragAndDrop';

interface DragConstraintsManagerProps {
  // Current drag state
  isDragging: boolean;
  currentPosition: Position;
  snapInfo: { type?: string; target?: string } | null;
  collisions: string[];

  // Configuration
  showGrid?: boolean;
  gridSize?: number;
  showFormationSlots?: boolean;
  showAlignmentGuides?: boolean;
  showCollisionWarnings?: boolean;

  // Data
  formationSlots?: FormationSlot[];
  tacticalZones?: TacticalZone[];
  otherPlayers?: PlayerCollision[];
}

/**
 * Manager component for all drag-related visual indicators
 * Handles grid overlay, snap indicators, collision warnings, and alignment guides
 */
export const DragConstraintsManager: React.FC<DragConstraintsManagerProps> = ({
  isDragging,
  currentPosition,
  snapInfo,
  collisions,
  showGrid = false,
  gridSize = 5,
  showFormationSlots = true,
  showAlignmentGuides = true,
  showCollisionWarnings = true,
  formationSlots = [],
  tacticalZones = [],
  otherPlayers = [],
}) => {
  /**
   * Find snap target details for label
   */
  const snapLabel = useMemo(() => {
    if (!snapInfo?.type) {
      return undefined;
    }

    switch (snapInfo.type) {
      case 'formation':
        const slot = formationSlots.find(s => s.id === snapInfo.target);
        return slot ? `Snap to ${slot.role}` : 'Formation slot';

      case 'zone':
        const zone = tacticalZones.find(z => z.id === snapInfo.target);
        return zone ? `Snap to ${zone.name}` : 'Tactical zone';

      case 'player':
        const player = otherPlayers.find(p => p.id === snapInfo.target);
        return player ? `Align with player` : 'Player alignment';

      case 'grid':
        return 'Grid snap';

      default:
        return undefined;
    }
  }, [snapInfo, formationSlots, tacticalZones, otherPlayers]);

  /**
   * Calculate alignment guides for nearby players
   */
  const alignmentGuides = useMemo(() => {
    if (!isDragging || !showAlignmentGuides || otherPlayers.length === 0) {
      return [];
    }

    const guides: Array<{
      id: string;
      type: 'horizontal' | 'vertical';
      position: number;
      start: number;
      end: number;
    }> = [];

    const alignmentThreshold = 4;

    for (const player of otherPlayers) {
      // Horizontal alignment (same Y)
      if (Math.abs(currentPosition.y - player.position.y) <= alignmentThreshold) {
        const minX = Math.min(currentPosition.x, player.position.x);
        const maxX = Math.max(currentPosition.x, player.position.x);

        guides.push({
          id: `h-${player.id}`,
          type: 'horizontal',
          position: player.position.y,
          start: minX - 5,
          end: maxX + 5,
        });
      }

      // Vertical alignment (same X)
      if (Math.abs(currentPosition.x - player.position.x) <= alignmentThreshold) {
        const minY = Math.min(currentPosition.y, player.position.y);
        const maxY = Math.max(currentPosition.y, player.position.y);

        guides.push({
          id: `v-${player.id}`,
          type: 'vertical',
          position: player.position.x,
          start: minY - 5,
          end: maxY + 5,
        });
      }
    }

    return guides;
  }, [isDragging, showAlignmentGuides, currentPosition, otherPlayers]);

  /**
   * Get snap indicator position
   * Use snapped position if available, otherwise current position
   */
  const snapIndicatorPosition = useMemo(() => {
    if (!snapInfo?.target) {
      return currentPosition;
    }

    switch (snapInfo.type) {
      case 'formation':
        const slot = formationSlots.find(s => s.id === snapInfo.target);
        return slot?.position || currentPosition;

      case 'zone':
        // For zones, use current position as it's already snapped
        return currentPosition;

      default:
        return currentPosition;
    }
  }, [snapInfo, currentPosition, formationSlots]);

  return (
    <>
      {/* Grid overlay - shown when grid snapping is enabled */}
      {showGrid && <GridOverlay gridSize={gridSize} visible={isDragging} opacity={0.3} />}

      {/* Formation slot indicators - show available slots when dragging */}
      {showFormationSlots && (
        <FormationSlotIndicators slots={formationSlots} visible={isDragging} />
      )}

      {/* Alignment guides - show when aligning with other players */}
      {showAlignmentGuides &&
        alignmentGuides.map(guide => (
          <AlignmentGuide
            key={guide.id}
            type={guide.type}
            position={guide.position}
            start={guide.start}
            end={guide.end}
            visible={isDragging}
          />
        ))}

      {/* Snap indicator - show when snapping to a target */}
      {snapInfo && snapInfo.type && (
        <SnapIndicator
          position={snapIndicatorPosition}
          type={snapInfo.type as 'grid' | 'formation' | 'zone' | 'player'}
          visible={isDragging}
          label={snapLabel}
        />
      )}

      {/* Collision warning - show when too close to other players */}
      {showCollisionWarnings && (
        <CollisionWarning
          position={currentPosition}
          collidingWith={collisions}
          visible={isDragging && collisions.length > 0}
        />
      )}
    </>
  );
};

export default DragConstraintsManager;
