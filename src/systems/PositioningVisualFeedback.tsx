/**
 * POSITIONING VISUAL FEEDBACK SYSTEM
 * 
 * Provides visual indicators for drag-drop operations:
 * - Snap point indicators (green/blue/purple rings)
 * - Collision warnings (red overlays)
 * - Drop zone highlights
 * - Drag ghost/preview
 * - Grid overlays
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SnapPoint, DragState, Point, PositioningConfig } from './PositioningSystem';

// ============================================================================
// SNAP POINT INDICATOR
// ============================================================================

interface SnapPointIndicatorProps {
  snapPoint: SnapPoint;
  isActive: boolean;
  isDragNear: boolean;
  type: 'formation' | 'grid' | 'player';
}

export const SnapPointIndicator = memo<SnapPointIndicatorProps>(
  ({ snapPoint, isActive, isDragNear, type }) => {
    // Color coding
    const colors = {
      formation: {
        ring: 'rgb(34, 197, 94)', // green-500
        glow: 'rgba(34, 197, 94, 0.3)',
      },
      grid: {
        ring: 'rgb(59, 130, 246)', // blue-500
        glow: 'rgba(59, 130, 246, 0.3)',
      },
      player: {
        ring: 'rgb(168, 85, 247)', // purple-500
        glow: 'rgba(168, 85, 247, 0.3)',
      },
    };
    
    const color = colors[type];
    
    if (!isDragNear && !isActive) return null;
    
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: `${snapPoint.x}%`,
          top: `${snapPoint.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: isActive ? 1 : 0.5,
          scale: isActive ? 1.2 : 1,
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${color.ring}`,
            boxShadow: `0 0 20px ${color.glow}`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Inner dot */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: '12px',
            height: '12px',
            margin: '18px',
            backgroundColor: color.ring,
            boxShadow: `0 0 10px ${color.glow}`,
          }}
        />
        
        {/* Label */}
        {isActive && snapPoint.role && (
          <div
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                       px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap"
            style={{
              backgroundColor: color.ring,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {snapPoint.role}
          </div>
        )}
      </motion.div>
    );
  }
);

SnapPointIndicator.displayName = 'SnapPointIndicator';

// ============================================================================
// COLLISION WARNING
// ============================================================================

interface CollisionWarningProps {
  position: Point;
  collidingPlayerIds: string[];
}

export const CollisionWarning = memo<CollisionWarningProps>(
  ({ position, collidingPlayerIds }) => {
    if (collidingPlayerIds.length === 0) return null;
    
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        {/* Red warning circle */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: '56px',
            height: '56px',
            border: '3px solid rgb(239, 68, 68)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        />
        
        {/* X icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgb(239, 68, 68)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </div>
        
        {/* Warning text */}
        <div
          className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                     px-3 py-1 rounded text-xs font-bold text-white whitespace-nowrap"
          style={{
            backgroundColor: 'rgb(239, 68, 68)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Too close! ({collidingPlayerIds.length})
        </div>
      </motion.div>
    );
  }
);

CollisionWarning.displayName = 'CollisionWarning';

// ============================================================================
// DRAG GHOST
// ============================================================================

interface DragGhostProps {
  startPosition: Point;
  playerName: string;
  playerNumber: number;
  team: 'home' | 'away';
}

export const DragGhost = memo<DragGhostProps>(
  ({ startPosition, playerName, playerNumber, team }) => {
    const initials = playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    const teamColor = team === 'home' ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)';
    
    return (
      <motion.div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${startPosition.x}%`,
          top: `${startPosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0.3, scale: 0.9 }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center
                     text-white font-bold text-sm border-2 border-white/50"
          style={{
            backgroundColor: teamColor,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {initials}
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full 
                     flex items-center justify-center bg-white text-gray-900 
                     text-xs font-bold border-2"
          style={{
            borderColor: teamColor,
          }}
        >
          {playerNumber}
        </div>
      </motion.div>
    );
  }
);

DragGhost.displayName = 'DragGhost';

// ============================================================================
// DRAG PREVIEW
// ============================================================================

interface DragPreviewProps {
  currentPosition: Point;
  playerName: string;
  playerNumber: number;
  team: 'home' | 'away';
  isValid: boolean;
  wouldSnap: boolean;
}

export const DragPreview = memo<DragPreviewProps>(
  ({ currentPosition, playerName, playerNumber, team, isValid, wouldSnap }) => {
    const initials = playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    const teamColor = team === 'home' ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)';
    const borderColor = isValid ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    
    return (
      <motion.div
        className="absolute pointer-events-none z-50"
        style={{
          left: `${currentPosition.x}%`,
          top: `${currentPosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: wouldSnap ? 1.1 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
      >
        <motion.div
          className="w-14 h-14 rounded-full flex items-center justify-center
                     text-white font-bold text-base"
          style={{
            backgroundColor: teamColor,
            border: `3px solid ${borderColor}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 4px ${borderColor}33`,
          }}
          animate={{
            boxShadow: wouldSnap
              ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 8px ${borderColor}33`
              : `0 8px 24px rgba(0,0,0,0.4), 0 0 0 4px ${borderColor}33`,
          }}
        >
          {initials}
        </motion.div>
        <div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full 
                     flex items-center justify-center bg-white text-gray-900 
                     text-xs font-bold border-2"
          style={{
            borderColor: teamColor,
          }}
        >
          {playerNumber}
        </div>
        
        {/* Validity indicator */}
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full 
                     flex items-center justify-center text-white text-xs"
          style={{
            backgroundColor: borderColor,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {isValid ? '✓' : '✗'}
        </motion.div>
      </motion.div>
    );
  }
);

DragPreview.displayName = 'DragPreview';

// ============================================================================
// GRID OVERLAY
// ============================================================================

interface GridOverlayProps {
  gridSize: number;
  visible: boolean;
  fieldWidth: number;
  fieldHeight: number;
}

export const GridOverlay = memo<GridOverlayProps>(
  ({ gridSize, visible, fieldWidth, fieldHeight }) => {
    if (!visible) return null;
    
    const lines: JSX.Element[] = [];
    let id = 0;
    
    // Vertical lines
    for (let x = 0; x <= 100; x += gridSize) {
      lines.push(
        <line
          key={`v-${id++}`}
          x1={`${x}%`}
          y1="0%"
          x2={`${x}%`}
          y2="100%"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= 100; y += gridSize) {
      lines.push(
        <line
          key={`h-${id++}`}
          x1="0%"
          y1={`${y}%`}
          x2="100%"
          y2={`${y}%`}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      );
    }
    
    return (
      <motion.svg
        className="absolute inset-0 pointer-events-none z-5"
        width="100%"
        height="100%"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {lines}
      </motion.svg>
    );
  }
);

GridOverlay.displayName = 'GridOverlay';

// ============================================================================
// FIELD ZONES OVERLAY
// ============================================================================

interface FieldZonesOverlayProps {
  visible: boolean;
}

export const FieldZonesOverlay = memo<FieldZonesOverlayProps>(({ visible }) => {
  if (!visible) return null;
  
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Defense zone */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: '33.33%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderBottom: '2px dashed rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-red-400 text-xs font-bold uppercase tracking-wider">
          Defense
        </div>
      </div>
      
      {/* Midfield zone */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '33.33%',
          height: '33.33%',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          borderBottom: '2px dashed rgba(234, 179, 8, 0.3)',
        }}
      >
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          Midfield
        </div>
      </div>
      
      {/* Attack zone */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '66.66%',
          height: '33.34%',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        }}
      >
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-green-400 text-xs font-bold uppercase tracking-wider">
          Attack
        </div>
      </div>
    </motion.div>
  );
});

FieldZonesOverlay.displayName = 'FieldZonesOverlay';

// ============================================================================
// COMPLETE VISUAL FEEDBACK SYSTEM
// ============================================================================

interface PositioningVisualFeedbackProps {
  config: PositioningConfig;
  dragState: DragState;
  snapPoints: SnapPoint[];
  fieldWidth: number;
  fieldHeight: number;
  players: Array<{
    id: string;
    name: string;
    jerseyNumber: number;
    team: 'home' | 'away';
  }>;
}

export const PositioningVisualFeedback: React.FC<PositioningVisualFeedbackProps> = memo(
  ({ config, dragState, snapPoints, fieldWidth, fieldHeight, players }) => {
    if (!config.showVisualFeedback) return null;
    
    const draggedPlayer = dragState.draggedPlayerId
      ? players.find(p => p.id === dragState.draggedPlayerId)
      : null;
    
    return (
      <>
        {/* Grid overlay */}
        <AnimatePresence>
          {(config.mode === 'freeform' || config.mode === 'hybrid') && (
            <GridOverlay
              gridSize={config.gridSize}
              visible={true}
              fieldWidth={fieldWidth}
              fieldHeight={fieldHeight}
            />
          )}
        </AnimatePresence>
        
        {/* Snap point indicators */}
        <AnimatePresence>
          {dragState.isDragging &&
            snapPoints.map(snapPoint => {
              const isNearSnap =
                dragState.nearestSnapPoint?.id === snapPoint.id;
              const isDragNear = dragState.currentPosition
                ? Math.abs(dragState.currentPosition.x - snapPoint.x) < 15 &&
                  Math.abs(dragState.currentPosition.y - snapPoint.y) < 15
                : false;
              
              const type = snapPoint.id.startsWith('formation')
                ? 'formation'
                : snapPoint.id.startsWith('grid')
                ? 'grid'
                : 'player';
              
              return (
                <SnapPointIndicator
                  key={snapPoint.id}
                  snapPoint={snapPoint}
                  isActive={isNearSnap}
                  isDragNear={isDragNear}
                  type={type}
                />
              );
            })}
        </AnimatePresence>
        
        {/* Drag ghost (original position) */}
        <AnimatePresence>
          {dragState.isDragging && dragState.startPosition && draggedPlayer && (
            <DragGhost
              startPosition={dragState.startPosition}
              playerName={draggedPlayer.name}
              playerNumber={draggedPlayer.jerseyNumber}
              team={draggedPlayer.team}
            />
          )}
        </AnimatePresence>
        
        {/* Drag preview (current position) */}
        <AnimatePresence>
          {dragState.isDragging && dragState.currentPosition && draggedPlayer && (
            <DragPreview
              currentPosition={dragState.currentPosition}
              playerName={draggedPlayer.name}
              playerNumber={draggedPlayer.jerseyNumber}
              team={draggedPlayer.team}
              isValid={!dragState.wouldCollide}
              wouldSnap={!!dragState.nearestSnapPoint}
            />
          )}
        </AnimatePresence>
        
        {/* Collision warning */}
        <AnimatePresence>
          {dragState.isDragging &&
            dragState.wouldCollide &&
            dragState.currentPosition && (
              <CollisionWarning
                position={dragState.currentPosition}
                collidingPlayerIds={dragState.collidingPlayers}
              />
            )}
        </AnimatePresence>
      </>
    );
  }
);

PositioningVisualFeedback.displayName = 'PositioningVisualFeedback';


