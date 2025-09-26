import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useTacticsContext, useUIContext } from './index';
import type { Player, FormationSlot, Team, Position } from '../types';

export interface AdvancedTacticsBoardState {
  isDragging: boolean;
  draggedPlayer: Player | null;
  dragOverSlot: string | null;
  validDropZones: string[];
  magneticZones: string[];
  dragPreview: { x: number; y: number } | null;
  multiSelectPlayers: string[];
  snapDistance: number;
  ghostPosition: Position | null;
  isMultiSelect: boolean;
  dragStartPosition: Position | null;
  draggedDistance: number;
}

export interface AdvancedTacticsBoardActions {
  startDrag: (player: Player, event: React.DragEvent | React.TouchEvent) => void;
  startMultiSelect: (startPosition: Position) => void;
  updateMultiSelect: (currentPosition: Position) => void;
  endMultiSelect: () => void;
  endDrag: () => void;
  handleSlotDragOver: (slotId: string, event: React.DragEvent) => void;
  handleSlotDragLeave: () => void;
  handleSlotDrop: (slot: FormationSlot, team: Team, event: React.DragEvent) => void;
  handleFieldDrop: (event: React.DragEvent | React.TouchEvent) => void;
  validateDrop: (playerId: string, targetSlotId?: string) => boolean;
  getMagneticSnapPosition: (position: Position, targetSlots: FormationSlot[]) => Position;
  clearMultiSelection: () => void;
  addToMultiSelection: (playerId: string) => void;
  removeFromMultiSelection: (playerId: string) => void;
}

const SNAP_DISTANCE = 8; // Percentage distance for magnetic snapping
const MULTI_SELECT_THRESHOLD = 10; // Minimum distance to start multi-select

export function useAdvancedTacticsBoard(): AdvancedTacticsBoardState & AdvancedTacticsBoardActions {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { players, formations, activeFormationIds } = tacticsState || {};
  const { drawingTool, positioningMode } = uiState || {};

  const [boardState, setBoardState] = useState<AdvancedTacticsBoardState>({
    isDragging: false,
    draggedPlayer: null,
    dragOverSlot: null,
    validDropZones: [],
    magneticZones: [],
    dragPreview: null,
    multiSelectPlayers: [],
    snapDistance: SNAP_DISTANCE,
    ghostPosition: null,
    isMultiSelect: false,
    dragStartPosition: null,
    draggedDistance: 0,
  });

  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const multiSelectStartRef = useRef<Position | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced validation with role compatibility and advanced rules
  const validateDrop = useCallback(
    (playerId: string, targetSlotId?: string): boolean => {
      if (!playerId || typeof playerId !== 'string') {
        return false;
      }

      if (!players || !Array.isArray(players)) {
        return false;
      }

      const player = players.find(p => p?.id === playerId);
      if (!player || !player.id) {
        return false;
      }

      // Check player availability
      if (player.availability && player.availability !== 'available') {
        return false;
      }

      // If targeting a specific slot, validate advanced role compatibility
      if (targetSlotId) {
        if (!formations || !activeFormationIds) {
          return false;
        }

        const homeFormation = formations[activeFormationIds.home];
        const awayFormation = formations[activeFormationIds.away];

        if (!homeFormation?.slots || !awayFormation?.slots) {
          return false;
        }

        const targetSlot =
          homeFormation.slots.find(s => s?.id === targetSlotId) ||
          awayFormation.slots.find(s => s?.id === targetSlotId);

        if (!targetSlot || !targetSlot.id) {
          return false;
        }

        // Advanced role compatibility matrix
        const playerRole = player.roleId || 'unknown';
        const slotRole = targetSlot.roleId || 'unknown';

        const advancedRoleCompatibility: Record<string, { primary: string[]; secondary: string[]; restricted: string[] }> = {
          goalkeeper: { 
            primary: ['goalkeeper'], 
            secondary: [], 
            restricted: ['striker', 'winger', 'attacking-midfielder'] 
          },
          'center-back': { 
            primary: ['center-back'], 
            secondary: ['defensive-midfielder', 'full-back'], 
            restricted: ['striker', 'winger'] 
          },
          'full-back': { 
            primary: ['full-back', 'wing-back'], 
            secondary: ['winger', 'center-back'], 
            restricted: ['goalkeeper', 'striker'] 
          },
          'wing-back': { 
            primary: ['wing-back', 'full-back'], 
            secondary: ['winger', 'defensive-midfielder'], 
            restricted: ['goalkeeper', 'striker'] 
          },
          'defensive-midfielder': { 
            primary: ['defensive-midfielder'], 
            secondary: ['center-back', 'central-midfielder'], 
            restricted: ['goalkeeper', 'striker'] 
          },
          'central-midfielder': { 
            primary: ['central-midfielder'], 
            secondary: ['defensive-midfielder', 'attacking-midfielder'], 
            restricted: ['goalkeeper'] 
          },
          'attacking-midfielder': { 
            primary: ['attacking-midfielder'], 
            secondary: ['central-midfielder', 'winger'], 
            restricted: ['goalkeeper', 'center-back'] 
          },
          winger: { 
            primary: ['winger'], 
            secondary: ['wing-back', 'attacking-midfielder'], 
            restricted: ['goalkeeper', 'center-back'] 
          },
          striker: { 
            primary: ['striker'], 
            secondary: ['attacking-midfielder'], 
            restricted: ['goalkeeper', 'center-back', 'full-back'] 
          },
        };

        const compatibility = advancedRoleCompatibility[slotRole];
        if (compatibility) {
          // Check if role is restricted
          if (compatibility.restricted.includes(playerRole)) {
            return false;
          }
          // Allow primary and secondary roles
          return compatibility.primary.includes(playerRole) || compatibility.secondary.includes(playerRole);
        }
      }

      return true;
    },
    [players, formations, activeFormationIds],
  );

  // Get magnetic snap position for smooth snapping
  const getMagneticSnapPosition = useCallback(
    (position: Position, targetSlots: FormationSlot[]): Position => {
      let snapPosition = { ...position };
      let minDistance = SNAP_DISTANCE;

      for (const slot of targetSlots) {
        if (!slot.position) continue;

        const distance = Math.sqrt(
          Math.pow(position.x - slot.position.x, 2) + 
          Math.pow(position.y - slot.position.y, 2)
        );

        if (distance < minDistance) {
          snapPosition = { ...slot.position };
          minDistance = distance;
        }
      }

      return snapPosition;
    },
    [],
  );

  // Get valid drop zones with magnetic zones
  const getValidDropZones = useCallback(
    (playerId: string): { valid: string[]; magnetic: string[] } => {
      if (!playerId || typeof playerId !== 'string') {
        return { valid: [], magnetic: [] };
      }

      if (!players || !Array.isArray(players)) {
        return { valid: [], magnetic: [] };
      }

      const player = players.find(p => p?.id === playerId);
      if (!player || !player.id) {
        return { valid: [], magnetic: [] };
      }

      if (!formations || !activeFormationIds) {
        return { valid: [], magnetic: [] };
      }

      const homeFormation = formations[activeFormationIds.home];
      const awayFormation = formations[activeFormationIds.away];

      if (!homeFormation?.slots || !awayFormation?.slots) {
        return { valid: [], magnetic: [] };
      }

      const validZones: string[] = [];
      const magneticZones: string[] = [];

      const checkFormation = (formation: any, teamCheck: string) => {
        if (player.team === teamCheck) {
          formation.slots
            .filter((slot: any) => slot && slot.id)
            .forEach((slot: any) => {
              if (validateDrop(playerId, slot.id)) {
                validZones.push(slot.id);
                
                // Check if this is a preferred position (magnetic zone)
                const playerRole = player.roleId || 'unknown';
                const slotRole = slot.roleId || 'unknown';
                
                if (playerRole === slotRole) {
                  magneticZones.push(slot.id);
                }
              }
            });
        }
      };

      checkFormation(homeFormation, 'home');
      checkFormation(awayFormation, 'away');

      return { valid: validZones, magnetic: magneticZones };
    },
    [players, formations, activeFormationIds, validateDrop],
  );

  // Enhanced drag start with multi-touch support
  const startDrag = useCallback(
    (player: Player, event: React.DragEvent | React.TouchEvent) => {
      if (!player || !player.id || !player.name) {
        if ('preventDefault' in event) event.preventDefault();
        return;
      }

      if (drawingTool !== 'select') {
        if ('preventDefault' in event) event.preventDefault();
        return;
      }

      const dropZones = getValidDropZones(player.id);
      const clientX = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY || 0;

      try {
        setBoardState(prev => ({
          ...prev,
          isDragging: true,
          draggedPlayer: player,
          validDropZones: dropZones.valid,
          magneticZones: dropZones.magnetic,
          dragPreview: { x: clientX, y: clientY },
          dragStartPosition: { x: clientX, y: clientY },
          draggedDistance: 0,
        }));

        // Enhanced drag image for better visual feedback
        if ('dataTransfer' in event) {
          const dragImage = document.createElement('div');
          dragImage.className = 'advanced-drag-preview';
          
          const playerInitials = player.name
            ?.split(' ')
            .map(n => n[0] || '')
            .join('')
            .slice(0, 2) || '??';

          const teamColor = player.team === 'home' ? '#3b82f6' : '#ef4444';
          
          dragImage.innerHTML = `
            <div style="
              width: 60px; 
              height: 60px; 
              border-radius: 50%; 
              background: linear-gradient(135deg, ${teamColor}, ${teamColor}dd);
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2);
              backdrop-filter: blur(8px);
              position: relative;
            ">
              ${playerInitials}
              <div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                border: 2px solid ${teamColor}66;
                animation: pulse 1s infinite;
              "></div>
            </div>
          `;

          dragImage.style.position = 'absolute';
          dragImage.style.top = '-1000px';
          dragImage.style.transform = 'scale(1.1)';
          document.body.appendChild(dragImage);

          event.dataTransfer.setData('text/plain', player.id);
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setDragImage(dragImage, 30, 30);

          // Enhanced cleanup
          setTimeout(() => {
            if (document.body.contains(dragImage)) {
              document.body.removeChild(dragImage);
            }
          }, 0);
        }
      } catch (error) {
        console.error('Failed to start drag operation:', error);
      }
    },
    [drawingTool, getValidDropZones],
  );

  // Multi-select functionality
  const startMultiSelect = useCallback((startPosition: Position) => {
    multiSelectStartRef.current = startPosition;
    setBoardState(prev => ({
      ...prev,
      isMultiSelect: true,
      dragStartPosition: startPosition,
    }));
  }, []);

  const updateMultiSelect = useCallback((currentPosition: Position) => {
    if (!multiSelectStartRef.current) return;

    const startPos = multiSelectStartRef.current;
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - startPos.x, 2) + 
      Math.pow(currentPosition.y - startPos.y, 2)
    );

    if (distance > MULTI_SELECT_THRESHOLD) {
      // Find players within selection rectangle
      const minX = Math.min(startPos.x, currentPosition.x);
      const maxX = Math.max(startPos.x, currentPosition.x);
      const minY = Math.min(startPos.y, currentPosition.y);
      const maxY = Math.max(startPos.y, currentPosition.y);

      const selectedPlayerIds = players
        ?.filter(player => {
          if (!player.position) return false;
          return (
            player.position.x >= minX &&
            player.position.x <= maxX &&
            player.position.y >= minY &&
            player.position.y <= maxY
          );
        })
        .map(player => player.id) || [];

      setBoardState(prev => ({
        ...prev,
        multiSelectPlayers: selectedPlayerIds,
      }));
    }
  }, [players]);

  const endMultiSelect = useCallback(() => {
    multiSelectStartRef.current = null;
    setBoardState(prev => ({
      ...prev,
      isMultiSelect: false,
      dragStartPosition: null,
    }));
  }, []);

  const endDrag = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      isDragging: false,
      draggedPlayer: null,
      dragOverSlot: null,
      validDropZones: [],
      magneticZones: [],
      dragPreview: null,
      ghostPosition: null,
      dragStartPosition: null,
      draggedDistance: 0,
    }));
  }, []);

  // Enhanced slot drag over with magnetic feedback
  const handleSlotDragOver = useCallback(
    (slotId: string, event: React.DragEvent) => {
      event.preventDefault();

      if (!slotId || typeof slotId !== 'string') {
        event.dataTransfer.dropEffect = 'none';
        return;
      }

      const playerId = event.dataTransfer.getData('text/plain');
      if (!playerId || !validateDrop(playerId, slotId)) {
        event.dataTransfer.dropEffect = 'none';
        return;
      }

      event.dataTransfer.dropEffect = 'move';
      setBoardState(prev => ({
        ...prev,
        dragOverSlot: slotId,
      }));

      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    [validateDrop],
  );

  const handleSlotDragLeave = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      dragOverSlot: null,
    }));
  }, []);

  // Enhanced slot drop with animations
  const handleSlotDrop = useCallback(
    (slot: FormationSlot, team: Team, event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!slot || !slot.id) {
        endDrag();
        return;
      }

      if (!team || (team !== 'home' && team !== 'away')) {
        endDrag();
        return;
      }

      const playerId = event.dataTransfer.getData('text/plain');
      if (!playerId) {
        endDrag();
        return;
      }

      if (!validateDrop(playerId, slot.id)) {
        endDrag();
        return;
      }

      try {
        // Enhanced feedback for successful drop
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }

        // Handle multi-player operations
        if (boardState.multiSelectPlayers.length > 0 && boardState.multiSelectPlayers.includes(playerId)) {
          // Multi-player assignment logic
          const availableSlots = formations?.[activeFormationIds?.[team]]?.slots
            ?.filter(s => !s.playerId && validateDrop(playerId, s.id)) || [];

          boardState.multiSelectPlayers.forEach((pid, index) => {
            if (availableSlots[index]) {
              dispatch({
                type: 'ASSIGN_PLAYER_TO_SLOT',
                payload: { slotId: availableSlots[index].id, playerId: pid, team },
              });
            }
          });

          setBoardState(prev => ({ ...prev, multiSelectPlayers: [] }));
        } else {
          // Single player operations
          if (slot.playerId && slot.playerId !== playerId) {
            const draggedPlayer = players?.find(p => p?.id === playerId);
            const occupyingPlayer = players?.find(p => p?.id === slot.playerId);

            if (draggedPlayer?.name && occupyingPlayer?.name) {
              const shouldSwap = window.confirm(
                `Swap ${draggedPlayer.name} with ${occupyingPlayer.name}?`,
              );

              if (shouldSwap) {
                dispatch({
                  type: 'SWAP_PLAYERS',
                  payload: { playerId1: playerId, playerId2: slot.playerId },
                });
              }
            }
          } else {
            dispatch({
              type: 'ASSIGN_PLAYER_TO_SLOT',
              payload: { slotId: slot.id, playerId, team },
            });
          }
        }
      } catch (error) {
        console.error('Failed to handle slot drop:', error);
      } finally {
        endDrag();
      }
    },
    [validateDrop, players, dispatch, endDrag, boardState.multiSelectPlayers, formations, activeFormationIds],
  );

  // Enhanced field drop with magnetic snapping
  const handleFieldDrop = useCallback(
    (event: React.DragEvent | React.TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const playerId = 'dataTransfer' in event 
        ? event.dataTransfer.getData('text/plain')
        : boardState.draggedPlayer?.id;

      if (!playerId || typeof playerId !== 'string') {
        endDrag();
        return;
      }

      if (!validateDrop(playerId)) {
        endDrag();
        return;
      }

      if (positioningMode === 'snap') {
        endDrag();
        return;
      }

      // Enhanced field drop logic with magnetic snapping
      const target = event.target as HTMLElement;
      if (target && target.closest && target.closest('[data-is-interactive-zone="true"]')) {
        endDrag();
        return;
      }

      const currentTarget = event.currentTarget as HTMLElement;
      if (!currentTarget || !currentTarget.getBoundingClientRect) {
        endDrag();
        return;
      }

      const fieldRect = currentTarget.getBoundingClientRect();
      if (!fieldRect || fieldRect.width === 0 || fieldRect.height === 0) {
        endDrag();
        return;
      }

      const clientX = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX || 0;
      const clientY = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY || 0;

      let x = Math.max(5, Math.min(95, ((clientX - fieldRect.left) / fieldRect.width) * 100));
      let y = Math.max(5, Math.min(95, ((clientY - fieldRect.top) / fieldRect.height) * 100));

      if (isNaN(x) || isNaN(y)) {
        endDrag();
        return;
      }

      // Apply magnetic snapping if enabled
      if (positioningMode === 'snap') {
        const allSlots = [
          ...(formations?.[activeFormationIds?.home]?.slots || []),
          ...(formations?.[activeFormationIds?.away]?.slots || []),
        ].filter(slot => slot.position);

        const snappedPosition = getMagneticSnapPosition({ x, y }, allSlots);
        x = snappedPosition.x;
        y = snappedPosition.y;
      }

      try {
        // Enhanced feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }

        dispatch({
          type: 'UPDATE_PLAYER_POSITION',
          payload: { playerId, position: { x, y } },
        });
      } catch (error) {
        console.error('handleFieldDrop: Failed to update player position:', error);
      } finally {
        endDrag();
      }
    },
    [validateDrop, positioningMode, dispatch, endDrag, boardState.draggedPlayer, formations, activeFormationIds, getMagneticSnapPosition],
  );

  // Multi-selection management
  const clearMultiSelection = useCallback(() => {
    setBoardState(prev => ({ ...prev, multiSelectPlayers: [] }));
  }, []);

  const addToMultiSelection = useCallback((playerId: string) => {
    setBoardState(prev => ({
      ...prev,
      multiSelectPlayers: [...prev.multiSelectPlayers, playerId],
    }));
  }, []);

  const removeFromMultiSelection = useCallback((playerId: string) => {
    setBoardState(prev => ({
      ...prev,
      multiSelectPlayers: prev.multiSelectPlayers.filter(id => id !== playerId),
    }));
  }, []);

  return {
    ...boardState,
    startDrag,
    startMultiSelect,
    updateMultiSelect,
    endMultiSelect,
    endDrag,
    handleSlotDragOver,
    handleSlotDragLeave,
    handleSlotDrop,
    handleFieldDrop,
    validateDrop,
    getMagneticSnapPosition,
    clearMultiSelection,
    addToMultiSelection,
    removeFromMultiSelection,
  };
}