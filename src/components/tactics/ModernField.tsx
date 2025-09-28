import React, { useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { type Formation, type Player } from '../../types';
import { PlayerToken } from './PlayerToken';
import { FieldMarkings } from './FieldMarkings';
import { DragIndicator } from './DragIndicator';
import { PlayerStatsOverlay } from './PlayerStatsOverlay';
import HeatMapAnalytics from './HeatMapAnalytics';
import { useResponsive } from '../../hooks';
import { isValidFormation, getFormationSlots, isValidPlayer } from '../../utils/tacticalDataGuards';
import { 
  useAnimationFrame, 
  useFastMemo, 
  useThrottleCallback, 
  PerformanceMonitor,
  shallowEqual,
  useBatteryAwarePerformance
} from '../../utils/performanceOptimizations';

interface ModernFieldProps {
  formation: Formation | undefined;
  selectedPlayer: Player | null;
  onPlayerMove: (playerId: string, position: { x: number; y: number }, targetPlayerId?: string) => void;
  onPlayerSelect: (player: Player, position?: { x: number; y: number }) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  viewMode: 'standard' | 'fullscreen' | 'presentation';
  players?: Player[];
  showHeatMap?: boolean;
  showPlayerStats?: boolean;
  positioningMode?: 'snap' | 'free';
  performanceMode?: boolean;
}

interface DragState {
  playerId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  isValid: boolean;
  isSnapping?: boolean;
  targetSlotId?: string;
  targetPlayerId?: string;
}

const ModernField: React.FC<ModernFieldProps> = ({
  formation,
  selectedPlayer,
  onPlayerMove,
  onPlayerSelect,
  isDragging,
  setIsDragging,
  viewMode,
  players = [],
  showHeatMap = false,
  showPlayerStats = false,
  positioningMode = 'snap',
  performanceMode = false,
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const { isLowPower, getOptimizedConfig } = useBatteryAwarePerformance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  
  // Performance tracking
  const renderEndRef = useRef<(() => void) | null>(null);
  
  useLayoutEffect(() => {
    renderEndRef.current = performanceMonitor.startRender();
    return () => {
      if (renderEndRef.current) {
        renderEndRef.current();
      }
    };
  });

  const [dragState, setDragState] = useState<DragState>({
    playerId: null,
    startPosition: null,
    currentPosition: null,
    isValid: true,
  });

  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  
  // Performance-optimized state
  const animationConfigRef = useRef(getOptimizedConfig());
  const lastRenderTimeRef = useRef(Date.now());
  
  // Update animation config based on battery state
  useEffect(() => {
    animationConfigRef.current = getOptimizedConfig();
  }, [isLowPower, getOptimizedConfig]);

  // Throttled dimension updates for better performance
  const updateDimensions = useThrottleCallback(() => {
    if (fieldRef.current) {
      const rect = fieldRef.current.getBoundingClientRect();
      const newDimensions = { width: rect.width, height: rect.height };
      
      // Only update if dimensions actually changed
      setFieldDimensions(prev => {
        if (prev.width !== newDimensions.width || prev.height !== newDimensions.height) {
          return newDimensions;
        }
        return prev;
      });
    }
  }, 100); // Throttle to 10fps for resize events
  
  useEffect(() => {
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (fieldRef.current) {
      resizeObserver.observe(fieldRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateDimensions]);

  // Validate position within field bounds
  const validatePosition = useCallback((x: number, y: number) => {
    return x >= 5 && x <= 95 && y >= 5 && y <= 95;
  }, []);

  // Enhanced snapping logic - find nearest valid snap point
  const findNearestSnapPoint = useCallback((x: number, y: number) => {
    if (positioningMode !== 'snap' || !formation?.slots) {
      return { x, y, isSnapping: false };
    }

    const snapRadius = 15; // 15% of field size for snap detection
    let nearestSlot = null;
    let minDistance = snapRadius;

    // Find the nearest available slot within snap radius
    for (const slot of formation.slots) {
      if (!slot.position) continue;
      
      const distance = Math.sqrt(
        Math.pow(slot.position.x - x, 2) + Math.pow(slot.position.y - y, 2)
      );

      // Only snap to empty slots or slots with different players (for swapping)
      const isSlotAvailable = !slot.playerId || slot.playerId !== dragState.playerId;
      
      if (distance < minDistance && isSlotAvailable) {
        minDistance = distance;
        nearestSlot = slot;
      }
    }

    if (nearestSlot?.position) {
      return {
        x: nearestSlot.position.x,
        y: nearestSlot.position.y,
        isSnapping: true,
        slotId: nearestSlot.id,
        targetPlayerId: nearestSlot.playerId
      };
    }

    return { x, y, isSnapping: false };
  }, [positioningMode, formation?.slots, dragState.playerId]);

  // Convert screen coordinates to field percentage
  const screenToFieldPosition = useCallback((clientX: number, clientY: number) => {
    if (!fieldRef.current) {return null;}

    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Enhanced drag start handler
  const handleDragStart = useCallback((player: Player, startPos: { x: number; y: number }) => {
    setDragState({
      playerId: player.id,
      startPosition: startPos,
      currentPosition: startPos,
      isValid: true,
    });
    setIsDragging(true);
    onPlayerSelect(player);

    // Enable grid during drag
    setShowGrid(true);
  }, [setIsDragging, onPlayerSelect]);

  // Ultra-optimized drag handler with enhanced snapping
  const handleDrag = useCallback((info: PanInfo) => {
    if (!dragState.playerId || !fieldRef.current) return;

    // Use RAF to batch position updates
    requestAnimationFrame(() => {
      if (!fieldRef.current) return;
      
      const rect = fieldRef.current.getBoundingClientRect();
      const rawX = ((info.point.x - rect.left) / rect.width) * 100;
      const rawY = ((info.point.y - rect.top) / rect.height) * 100;

      // Apply snapping logic
      const snapResult = findNearestSnapPoint(rawX, rawY);
      const { x, y, isSnapping } = snapResult;

      const isValid = validatePosition(x, y);

      setDragState(prev => {
        // Skip update if position hasn't changed significantly
        const threshold = 0.5; // 0.5% threshold for position changes
        if (prev.currentPosition && 
            Math.abs(prev.currentPosition.x - x) < threshold &&
            Math.abs(prev.currentPosition.y - y) < threshold &&
            prev.isValid === isValid) {
          return prev;
        }
        
        return {
          ...prev,
          currentPosition: { x, y },
          isValid,
          isSnapping,
          targetSlotId: snapResult.slotId,
          targetPlayerId: snapResult.targetPlayerId
        };
      });

      // Enhanced haptic feedback
      if (isMobile && 'vibrate' in navigator) {
        const now = Date.now();
        if (now - lastRenderTimeRef.current > 100) { // Throttle vibration
          if (isSnapping) {
            navigator.vibrate(25); // Short pulse for snap
          } else if (!isValid) {
            navigator.vibrate(50); // Longer pulse for invalid position
          }
          lastRenderTimeRef.current = now;
        }
      }
    });
  }, [dragState.playerId, validatePosition, findNearestSnapPoint, isMobile]);

  // Enhanced drag end handler with smart snapping and conflict detection
  const handleDragEnd = useCallback((info: PanInfo) => {
    if (!dragState.playerId || !dragState.currentPosition) {
      setIsDragging(false);
      setShowGrid(false);
      setDragState({
        playerId: null,
        startPosition: null,
        currentPosition: null,
        isValid: true,
      });
      return;
    }

    const { x, y } = dragState.currentPosition;

    if (dragState.isValid && validatePosition(x, y)) {
      let finalTargetPlayerId: string | undefined;
      
      // Use snap target if available
      if (dragState.isSnapping && dragState.targetPlayerId) {
        finalTargetPlayerId = dragState.targetPlayerId;
      } else if (positioningMode === 'free') {
        // Fallback to collision detection in free mode
        const collisionRadius = 5; // 5% of field size
        const collidingPlayer = players.find(p => 
          p.id !== dragState.playerId && 
          p.position &&
          Math.abs(p.position.x - x) < collisionRadius &&
          Math.abs(p.position.y - y) < collisionRadius
        );
        
        if (collidingPlayer) {
          finalTargetPlayerId = collidingPlayer.id;
        }
      }
      
      onPlayerMove(dragState.playerId, { x, y }, finalTargetPlayerId);

      // Enhanced success haptic feedback
      if (isMobile && 'vibrate' in navigator) {
        if (dragState.isSnapping) {
          navigator.vibrate([25, 25, 100]); // Quick snap + long success
        } else {
          navigator.vibrate([50, 50, 50]); // Triple pulse for success
        }
      }
    }

    setIsDragging(false);
    setShowGrid(false);
    setDragState({
      playerId: null,
      startPosition: null,
      currentPosition: null,
      isValid: true,
    });
  }, [dragState, validatePosition, onPlayerMove, setIsDragging, isMobile, positioningMode, players]);

  /**
   * Handle native HTML5 drag over events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle native HTML5 drop events with enhanced snapping
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // Apply snapping logic for HTML5 drag and drop
    const snapResult = findNearestSnapPoint(rawX, rawY);
    const { x, y } = snapResult;

    // Validate position bounds
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    // Use target player ID from snap result if available
    onPlayerMove(playerId, { x: boundedX, y: boundedY }, snapResult.targetPlayerId);

    // Success haptic feedback for snap
    if (isMobile && 'vibrate' in navigator && snapResult.isSnapping) {
      navigator.vibrate([25, 25, 100]); // Quick snap + long success
    }
  }, [onPlayerMove, findNearestSnapPoint, isMobile]);

  // Touch-friendly field tap handler
  const handleFieldTap = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {return;}

    const position = screenToFieldPosition(event.clientX, event.clientY);
    if (!position || !selectedPlayer) {return;}

    if (validatePosition(position.x, position.y)) {
      onPlayerMove(selectedPlayer.id, position);

      // Tap feedback
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, [isDragging, screenToFieldPosition, selectedPlayer, validatePosition, onPlayerMove, isMobile]);

  // Simple formation slots access
  const formationSlots = useMemo(() => {
    if (!formation?.slots) {
      return [];
    }
    return formation.slots;
  }, [formation?.slots]);

  // Simple player rendering
  const renderPlayers = useMemo(() => {
    // Early return for empty slots
    if (!formationSlots.length) return [];
    
    // Create a map for O(1) player lookup
    const playerMap = new Map(players.map(p => [p?.id, p]));
    
    return formationSlots.reduce<React.ReactElement[]>((acc, slot) => {
      if (!slot.playerId) return acc;

      const player = playerMap.get(slot.playerId);
      if (!player) return acc;

      const isDraggingThis = dragState.playerId === player.id;
      const position = isDraggingThis && dragState.currentPosition
        ? dragState.currentPosition
        : slot.defaultPosition;

      // Skip rendering players outside visible area in fullscreen
      if (viewMode === 'fullscreen' && fieldDimensions.width > 0) {
        const playerX = (position?.x || 0) * fieldDimensions.width / 100;
        const playerY = (position?.y || 0) * fieldDimensions.height / 100;
        
        // Simple frustum culling
        if (playerX < -100 || playerX > fieldDimensions.width + 100 ||
            playerY < -100 || playerY > fieldDimensions.height + 100) {
          return acc;
        }
      }

      acc.push(
        <PlayerToken
          key={player.id}
          player={player}
          position={position}
          isSelected={selectedPlayer?.id === player.id}
          onSelect={(playerId: string, clickPosition?: { x: number; y: number }) => {
            onPlayerSelect(player, clickPosition);
          }}
          onDragStart={(playerId: string) => {
            handleDragStart(player, position);
          }}
          onDragEnd={(playerId: string) => {
            // Handle the native HTML5 drag end
            handleDragEnd({ point: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, delta: { x: 0, y: 0 } });
          }}
          isDraggable={!isLowPower}
          isHighlightedByAI={false}
        />
      );
      
      return acc;
    }, []);
  }, [
    formationSlots,
    players,
    dragState.playerId,
    dragState.currentPosition,
    dragState.isValid,
    selectedPlayer?.id,
    viewMode,
    fieldDimensions.width,
    fieldDimensions.height,
    isLowPower,
    handleDragStart,
    handleDragEnd,
    onPlayerSelect
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Field Background */}
      <motion.div
        ref={fieldRef}
        className="relative w-full h-full cursor-pointer select-none"
        onClick={handleFieldTap}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={useMemo(() => ({
          background: isLowPower ? 
            // Simplified background for low power mode
            'linear-gradient(135deg, #166534 0%, #15803d 50%, #166534 100%)' :
            // Full quality background
            `radial-gradient(ellipse at center top, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
             radial-gradient(ellipse at center bottom, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
             linear-gradient(135deg, 
               #166534 0%, 
               #15803d 25%, 
               #16a34a 50%, 
               #15803d 75%, 
               #166534 100%
             )`,
          borderRadius: viewMode === 'fullscreen' ? '0' : '12px',
          boxShadow: isLowPower ? 
            'inset 0 0 50px rgba(0, 0, 0, 0.2)' :
            `inset 0 0 100px rgba(0, 0, 0, 0.3),
             inset 0 0 50px rgba(34, 197, 94, 0.1),
             ${viewMode !== 'fullscreen' ? '0 20px 40px rgba(0, 0, 0, 0.2)' : ''}`,
          willChange: isDragging ? 'transform' : 'auto', // GPU optimization hint
          transform: 'translateZ(0)', // Force GPU acceleration
        }), [viewMode, isLowPower, isDragging])}
      >
        {/* Stadium Lighting - Conditionally rendered for performance */}
        {!isLowPower && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
              `,
            }}
          />
        )}

        {/* Field Markings */}
        <FieldMarkings
          showGrid={showGrid}
          viewMode={viewMode}
        />

        {/* Enhanced Formation Zones with Snap Feedback */}
        <AnimatePresence>
          {formation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isDragging ? 0.6 : 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {formationSlots.map(slot => {
                const isSnapTarget = dragState.isSnapping && dragState.targetSlotId === slot.id;
                const isOccupied = slot.playerId && slot.playerId !== dragState.playerId;
                const isEmpty = !slot.playerId;
                
                return (
                  <motion.div
                    key={slot.id}
                    className="absolute rounded-full border-2 border-dashed"
                    style={{
                      left: `${slot.position?.x ?? 0}%`,
                      top: `${slot.position?.y ?? 0}%`,
                      width: '60px',
                      height: '60px',
                      transform: 'translate(-50%, -50%)',
                    }}
                    animate={{
                      scale: isSnapTarget ? 1.4 : hoveredSlot === slot.id ? 1.2 : 1,
                      borderColor: isSnapTarget 
                        ? 'rgba(34, 197, 94, 0.9)' // Green for snap target
                        : hoveredSlot === slot.id
                          ? 'rgba(59, 130, 246, 0.8)' // Blue for hover
                          : isOccupied
                            ? 'rgba(239, 68, 68, 0.5)' // Red for occupied
                            : isEmpty && isDragging
                              ? 'rgba(59, 130, 246, 0.6)' // Blue for available when dragging
                              : 'rgba(255, 255, 255, 0.3)', // Default white
                      backgroundColor: isSnapTarget 
                        ? 'rgba(34, 197, 94, 0.1)' // Light green fill for snap target
                        : 'transparent',
                      borderWidth: isSnapTarget ? '3px' : '2px',
                    }}
                    transition={{
                      scale: { duration: 0.2, ease: 'easeOut' },
                      borderColor: { duration: 0.15 },
                      backgroundColor: { duration: 0.15 },
                    }}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                  >
                    {/* Snap target indicator */}
                    {isSnapTarget && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-green-400"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0.5 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                          transform: 'translate(-50%, -50%)',
                          left: '50%',
                          top: '50%',
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heat Map Analytics */}
        <HeatMapAnalytics
          players={players}
          formation={formation}
          isVisible={showHeatMap}
          viewMode="team"
          selectedPlayerId={selectedPlayer?.id}
          onPlayerSelect={(playerId) => {
            const player = players.find(p => p.id === playerId);
            if (player) onPlayerSelect(player);
          }}
        />

        {/* Player Statistics Overlay */}
        <PlayerStatsOverlay
          formation={formation}
          players={players}
          selectedPlayer={selectedPlayer}
          showHeatMap={showHeatMap}
          showPlayerStats={showPlayerStats}
          fieldDimensions={fieldDimensions}
        />

        {/* Player Tokens - Optimized rendering */}
        <div 
          className="absolute inset-0"
          style={{
            willChange: isDragging ? 'contents' : 'auto',
            contain: 'layout style paint', // CSS containment for better performance
          }}
        >
          {renderPlayers}
        </div>

        {/* Drag Indicator */}
        <AnimatePresence>
          {isDragging && dragState.currentPosition && (
            <DragIndicator
              position={dragState.currentPosition}
              isValid={dragState.isValid}
              fieldDimensions={fieldDimensions}
            />
          )}
        </AnimatePresence>

        {/* Touch Helpers for Mobile */}
        {isMobile && selectedPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium"
          >
            Tap field to move {selectedPlayer.name}
          </motion.div>
        )}

        {/* Performance Mode Indicator */}
        {viewMode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Fullscreen Mode
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export { ModernField };
export default React.memo(ModernField);