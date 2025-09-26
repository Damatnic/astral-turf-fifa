import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { type Formation, type Player } from '../../types';
import { PlayerToken } from './PlayerToken';
import { FieldMarkings } from './FieldMarkings';
import { DragIndicator } from './DragIndicator';
import { PlayerStatsOverlay } from './PlayerStatsOverlay';
import { useResponsive } from '../../hooks';

interface ModernFieldProps {
  formation: Formation | undefined;
  selectedPlayer: Player | null;
  onPlayerMove: (playerId: string, position: { x: number; y: number }) => void;
  onPlayerSelect: (player: Player) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  viewMode: 'standard' | 'fullscreen' | 'presentation';
  players?: Player[];
  showHeatMap?: boolean;
  showPlayerStats?: boolean;
}

interface DragState {
  playerId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  isValid: boolean;
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
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();

  const [dragState, setDragState] = useState<DragState>({
    playerId: null,
    startPosition: null,
    currentPosition: null,
    isValid: true,
  });

  const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  // Update field dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (fieldRef.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        setFieldDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const resizeObserver = new (window as any).ResizeObserver(updateDimensions);
    if (fieldRef.current) {
      resizeObserver.observe(fieldRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Validate position within field bounds
  const validatePosition = useCallback((x: number, y: number) => {
    return x >= 5 && x <= 95 && y >= 5 && y <= 95;
  }, []);

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

  // Enhanced drag handler with haptic feedback
  const handleDrag = useCallback((info: PanInfo) => {
    if (!dragState.playerId || !fieldRef.current) {return;}

    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((info.point.x - rect.left) / rect.width) * 100;
    const y = ((info.point.y - rect.top) / rect.height) * 100;

    const isValid = validatePosition(x, y);

    setDragState(prev => ({
      ...prev,
      currentPosition: { x, y },
      isValid,
    }));

    // Haptic feedback for mobile devices
    if (isMobile && 'vibrate' in navigator) {
      if (!isValid) {
        navigator.vibrate(50); // Short vibration for invalid position
      }
    }
  }, [dragState.playerId, validatePosition, isMobile]);

  // Enhanced drag end handler
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
      onPlayerMove(dragState.playerId, { x, y });

      // Success haptic feedback
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]); // Triple pulse for success
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
  }, [dragState, validatePosition, onPlayerMove, setIsDragging, isMobile]);

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

  // Memoized formation slots
  const formationSlots = useMemo(() => {
    if (!formation?.slots) {return [];}
    return formation.slots.filter(slot =>
      slot?.position &&
      typeof slot.position.x === 'number' &&
      typeof slot.position.y === 'number',
    );
  }, [formation?.slots]);

  // Render player tokens
  const renderPlayers = useCallback(() => {
    return formationSlots.map(slot => {
      if (!slot.playerId) {return null;}

      const player = formation?.players?.find(p => p.id === slot.playerId);
      if (!player) {return null;}

      const isDraggingThis = dragState.playerId === player.id;
      const position = isDraggingThis && dragState.currentPosition
        ? dragState.currentPosition
        : slot.position;

      return (
        <PlayerToken
          key={player.id}
          player={player}
          position={position}
          isSelected={selectedPlayer?.id === player.id}
          isDragging={isDraggingThis}
          isValid={isDraggingThis ? dragState.isValid : true}
          onDragStart={(startPos) => handleDragStart(player, startPos)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onSelect={() => onPlayerSelect(player)}
          isMobile={isMobile}
        />
      );
    });
  }, [
    formationSlots,
    formation?.players,
    dragState,
    selectedPlayer?.id,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    onPlayerSelect,
    isMobile,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Field Background */}
      <motion.div
        ref={fieldRef}
        className="relative w-full h-full cursor-pointer select-none"
        onClick={handleFieldTap}
        style={{
          background: `
            radial-gradient(ellipse at center top, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at center bottom, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, 
              #166534 0%, 
              #15803d 25%, 
              #16a34a 50%, 
              #15803d 75%, 
              #166534 100%
            )
          `,
          borderRadius: viewMode === 'fullscreen' ? '0' : '12px',
          boxShadow: `
            inset 0 0 100px rgba(0, 0, 0, 0.3),
            inset 0 0 50px rgba(34, 197, 94, 0.1),
            ${viewMode !== 'fullscreen' ? '0 20px 40px rgba(0, 0, 0, 0.2)' : ''}
          `,
        }}
      >
        {/* Stadium Lighting */}
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

        {/* Field Markings */}
        <FieldMarkings
          showGrid={showGrid}
          viewMode={viewMode}
        />

        {/* Formation Zones */}
        <AnimatePresence>
          {formation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {formationSlots.map(slot => (
                <motion.div
                  key={slot.id}
                  className="absolute rounded-full border-2 border-dashed"
                  style={{
                    left: `${slot.position.x}%`,
                    top: `${slot.position.y}%`,
                    width: '60px',
                    height: '60px',
                    transform: 'translate(-50%, -50%)',
                    borderColor: slot.playerId ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.3)',
                  }}
                  animate={{
                    scale: hoveredSlot === slot.id ? 1.2 : 1,
                    borderColor: hoveredSlot === slot.id
                      ? 'rgba(59, 130, 246, 0.8)'
                      : slot.playerId
                        ? 'rgba(59, 130, 246, 0.4)'
                        : 'rgba(255, 255, 255, 0.3)',
                  }}
                  onMouseEnter={() => setHoveredSlot(slot.id)}
                  onMouseLeave={() => setHoveredSlot(null)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Statistics Overlay */}
        <PlayerStatsOverlay
          formation={formation}
          players={players}
          selectedPlayer={selectedPlayer}
          showHeatMap={showHeatMap}
          showPlayerStats={showPlayerStats}
          fieldDimensions={fieldDimensions}
        />

        {/* Player Tokens */}
        <div className="absolute inset-0">
          {renderPlayers()}
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