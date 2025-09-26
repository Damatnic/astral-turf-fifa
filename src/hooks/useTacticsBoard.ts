import { useCallback, useState, useRef, useEffect } from 'react';
import { useTacticsContext, useUIContext } from './index';
import type { Player, FormationSlot, Team } from '../types';

export interface TacticsBoardState {
  isDragging: boolean;
  draggedPlayer: Player | null;
  dragOverSlot: string | null;
  validDropZones: string[];
  dragPreview: { x: number; y: number } | null;
}

export interface TacticsBoardActions {
  startDrag: (player: Player, event: React.DragEvent) => void;
  endDrag: () => void;
  handleSlotDragOver: (slotId: string, event: React.DragEvent) => void;
  handleSlotDragLeave: () => void;
  handleSlotDrop: (slot: FormationSlot, team: Team, event: React.DragEvent) => void;
  handleFieldDrop: (event: React.DragEvent) => void;
  validateDrop: (playerId: string, targetSlotId?: string) => boolean;
}

export function useTacticsBoard(): TacticsBoardState & TacticsBoardActions {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { players, formations, activeFormationIds } = tacticsState;
  const { drawingTool, positioningMode } = uiState;

  const [boardState, setBoardState] = useState<TacticsBoardState>({
    isDragging: false,
    draggedPlayer: null,
    dragOverSlot: null,
    validDropZones: [],
    dragPreview: null,
  });

  const dragTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  const validateDrop = useCallback((playerId: string, targetSlotId?: string): boolean => {
    const player = players?.find(p => p?.id === playerId);
    if (!player) return false;

    // Check if player is available for positioning
    if (player.availability !== 'available') {
      return false;
    }

    // If targeting a specific slot, validate role compatibility
    if (targetSlotId) {
      const homeFormation = formations?.[activeFormationIds?.home];
      const awayFormation = formations?.[activeFormationIds?.away];
      
      const targetSlot = 
        homeFormation?.slots.find(s => s.id === targetSlotId) ||
        awayFormation?.slots.find(s => s.id === targetSlotId);
      
      if (!targetSlot) return false;

      // Check role compatibility (allow some flexibility)
      const playerRole = player.roleId;
      const slotRole = targetSlot.roleId;
      
      // Define compatible roles
      const roleCompatibility: Record<string, string[]> = {
        'goalkeeper': ['goalkeeper'],
        'center-back': ['center-back', 'defensive-midfielder'],
        'full-back': ['full-back', 'wing-back', 'winger'],
        'wing-back': ['wing-back', 'full-back', 'winger'],
        'defensive-midfielder': ['defensive-midfielder', 'center-back', 'central-midfielder'],
        'central-midfielder': ['central-midfielder', 'defensive-midfielder', 'attacking-midfielder'],
        'attacking-midfielder': ['attacking-midfielder', 'central-midfielder', 'winger'],
        'winger': ['winger', 'wing-back', 'attacking-midfielder'],
        'striker': ['striker', 'attacking-midfielder'],
      };

      const compatibleRoles = roleCompatibility[slotRole] || [slotRole];
      if (!compatibleRoles.includes(playerRole)) {
        return false;
      }
    }

    return true;
  }, [players, formations, activeFormationIds]);

  const getValidDropZones = useCallback((playerId: string): string[] => {
    const player = players?.find(p => p?.id === playerId);
    if (!player) return [];

    const homeFormation = formations?.[activeFormationIds?.home];
    const awayFormation = formations?.[activeFormationIds?.away];
    
    if (!homeFormation || !awayFormation) return [];

    const validZones: string[] = [];
    
    // Check home formation slots
    if (player.team === 'home') {
      homeFormation.slots.forEach(slot => {
        if (validateDrop(playerId, slot.id)) {
          validZones.push(slot.id);
        }
      });
    }
    
    // Check away formation slots
    if (player.team === 'away') {
      awayFormation.slots.forEach(slot => {
        if (validateDrop(playerId, slot.id)) {
          validZones.push(slot.id);
        }
      });
    }

    return validZones;
  }, [players, formations, activeFormationIds, validateDrop]);

  const startDrag = useCallback((player: Player, event: React.DragEvent) => {
    if (drawingTool !== 'select') {
      event.preventDefault();
      return;
    }

    const validZones = getValidDropZones(player.id);
    
    setBoardState(prev => ({
      ...prev,
      isDragging: true,
      draggedPlayer: player,
      validDropZones: validZones,
      dragPreview: { x: event.clientX, y: event.clientY },
    }));

    // Set drag data
    event.dataTransfer.setData('text/plain', player.id);
    event.dataTransfer.effectAllowed = 'move';

    // Create enhanced drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-preview';
    dragImage.innerHTML = `
      <div style="
        width: 48px; 
        height: 48px; 
        border-radius: 50%; 
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        ${player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
    `;
    
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    
    event.dataTransfer.setDragImage(dragImage, 24, 24);
    
    // Clean up drag image
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

  }, [drawingTool, getValidDropZones]);

  const endDrag = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      isDragging: false,
      draggedPlayer: null,
      dragOverSlot: null,
      validDropZones: [],
      dragPreview: null,
    }));
  }, []);

  const handleSlotDragOver = useCallback((slotId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    const playerId = event.dataTransfer.getData('text/plain');
    if (!validateDrop(playerId, slotId)) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.dataTransfer.dropEffect = 'move';
    setBoardState(prev => ({
      ...prev,
      dragOverSlot: slotId,
    }));
  }, [validateDrop]);

  const handleSlotDragLeave = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      dragOverSlot: null,
    }));
  }, []);

  const handleSlotDrop = useCallback((slot: FormationSlot, team: Team, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const playerId = event.dataTransfer.getData('text/plain');
    
    if (!validateDrop(playerId, slot.id)) {
      console.warn('Invalid drop: validation failed');
      endDrag();
      return;
    }

    try {
      // If slot is occupied, handle swap or replacement
      if (slot.playerId && slot.playerId !== playerId) {
        // Show confirmation for swap
        const draggedPlayer = players?.find(p => p.id === playerId);
        const occupyingPlayer = players?.find(p => p.id === slot.playerId);
        
        if (draggedPlayer && occupyingPlayer) {
          const shouldSwap = window.confirm(
            `Swap ${draggedPlayer.name} with ${occupyingPlayer.name}?`
          );
          
          if (shouldSwap) {
            dispatch({ 
              type: 'SWAP_PLAYERS', 
              payload: { playerId1: playerId, playerId2: slot.playerId } 
            });
          }
        }
      } else {
        // Assign player to empty slot
        dispatch({ 
          type: 'ASSIGN_PLAYER_TO_SLOT', 
          payload: { slotId: slot.id, playerId, team } 
        });
      }
    } catch (error) {
      console.error('Failed to handle slot drop:', error);
    } finally {
      endDrag();
    }
  }, [validateDrop, players, dispatch, endDrag]);

  const handleFieldDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const playerId = event.dataTransfer.getData('text/plain');
    
    if (!validateDrop(playerId)) {
      console.warn('Invalid field drop: validation failed');
      endDrag();
      return;
    }

    if (positioningMode === 'snap') {
      console.warn('Field drops not allowed in snap mode');
      endDrag();
      return;
    }

    // Don't process if dropped on an interactive zone
    if ((event.target as HTMLElement).closest('[data-is-interactive-zone="true"]')) {
      endDrag();
      return;
    }

    const fieldRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((event.clientX - fieldRect.left) / fieldRect.width) * 100));
    const y = Math.max(5, Math.min(95, ((event.clientY - fieldRect.top) / fieldRect.height) * 100));

    try {
      dispatch({ 
        type: 'UPDATE_PLAYER_POSITION', 
        payload: { playerId, position: { x, y } } 
      });
    } catch (error) {
      console.error('Failed to update player position:', error);
    } finally {
      endDrag();
    }
  }, [validateDrop, positioningMode, dispatch, endDrag]);

  return {
    ...boardState,
    startDrag,
    endDrag,
    handleSlotDragOver,
    handleSlotDragLeave,
    handleSlotDrop,
    handleFieldDrop,
    validateDrop,
  };
}
