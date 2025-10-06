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
  const { players, formations, activeFormationIds } = tacticsState || {};
  const { drawingTool, positioningMode } = uiState || {};

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

  const validateDrop = useCallback(
    (playerId: string, targetSlotId?: string): boolean => {
      // Validate inputs
      if (!playerId || typeof playerId !== 'string') {
        // // console.warn('validateDrop: Invalid playerId', playerId);
        return false;
      }

      if (!players || !Array.isArray(players)) {
        // // console.warn('validateDrop: Invalid players array', players);
        return false;
      }

      const player = players.find(p => p?.id === playerId);
      if (!player || !player.id) {
        // // console.warn('validateDrop: Player not found', { playerId, player });
        return false;
      }

      // Check if player is available for positioning
      if (player.availability && player.availability !== ('available' as any)) {
        // // console.warn('validateDrop: Player not available', { playerId, availability: player.availability });
        return false;
      }

      // If targeting a specific slot, validate role compatibility
      if (targetSlotId) {
        if (!formations || !activeFormationIds) {
          // // console.warn('validateDrop: Missing formations or activeFormationIds');
          return false;
        }

        const homeFormation = formations[activeFormationIds.home];
        const awayFormation = formations[activeFormationIds.away];

        if (!homeFormation?.slots || !awayFormation?.slots) {
          // // console.warn('validateDrop: Invalid formation slots');
          return false;
        }

        const targetSlot =
          homeFormation.slots.find(s => s?.id === targetSlotId) ||
          awayFormation.slots.find(s => s?.id === targetSlotId);

        if (!targetSlot || !targetSlot.id) {
          // // console.warn('validateDrop: Target slot not found', targetSlotId);
          return false;
        }

        // Check role compatibility (allow some flexibility)
        const playerRole = player.roleId || 'unknown';
        const slotRole = targetSlot.roleId || 'unknown';

        if (!playerRole || !slotRole) {
          // // console.warn('validateDrop: Missing role data', { playerRole, slotRole });
          return false;
        }

        // Define compatible roles
        const roleCompatibility: Record<string, string[]> = {
          goalkeeper: ['goalkeeper'],
          'center-back': ['center-back', 'defensive-midfielder'],
          'full-back': ['full-back', 'wing-back', 'winger'],
          'wing-back': ['wing-back', 'full-back', 'winger'],
          'defensive-midfielder': ['defensive-midfielder', 'center-back', 'central-midfielder'],
          'central-midfielder': [
            'central-midfielder',
            'defensive-midfielder',
            'attacking-midfielder',
          ],
          'attacking-midfielder': ['attacking-midfielder', 'central-midfielder', 'winger'],
          winger: ['winger', 'wing-back', 'attacking-midfielder'],
          striker: ['striker', 'attacking-midfielder'],
        };

        const compatibleRoles = roleCompatibility[slotRole] || [slotRole];
        if (!compatibleRoles.includes(playerRole)) {
          return false;
        }
      }

      return true;
    },
    [players, formations, activeFormationIds]
  );

  const getValidDropZones = useCallback(
    (playerId: string): string[] => {
      // Validate inputs
      if (!playerId || typeof playerId !== 'string') {
        // // console.warn('getValidDropZones: Invalid playerId', playerId);
        return [];
      }

      if (!players || !Array.isArray(players)) {
        // // console.warn('getValidDropZones: Invalid players array');
        return [];
      }

      const player = players.find(p => p?.id === playerId);
      if (!player || !player.id) {
        // // console.warn('getValidDropZones: Player not found', playerId);
        return [];
      }

      if (!formations || !activeFormationIds) {
        // // console.warn('getValidDropZones: Missing formations or activeFormationIds');
        return [];
      }

      const homeFormation = formations[activeFormationIds.home];
      const awayFormation = formations[activeFormationIds.away];

      if (!homeFormation?.slots || !awayFormation?.slots) {
        // // console.warn('getValidDropZones: Invalid formation slots');
        return [];
      }

      const validZones: string[] = [];

      // Check home formation slots
      if (player.team === 'home') {
        homeFormation.slots
          .filter(slot => slot && slot.id)
          .forEach(slot => {
            if (validateDrop(playerId, slot.id)) {
              validZones.push(slot.id);
            }
          });
      }

      // Check away formation slots
      if (player.team === 'away') {
        awayFormation.slots
          .filter(slot => slot && slot.id)
          .forEach(slot => {
            if (validateDrop(playerId, slot.id)) {
              validZones.push(slot.id);
            }
          });
      }

      return validZones;
    },
    [players, formations, activeFormationIds, validateDrop]
  );

  const startDrag = useCallback(
    (player: Player, event: React.DragEvent) => {
      // Validate player data
      if (!player || !player.id || !player.name) {
        // // console.warn('startDrag: Invalid player data', player);
        event.preventDefault();
        return;
      }

      if (drawingTool !== 'select') {
        // // console.warn('startDrag: Not in select mode');
        event.preventDefault();
        return;
      }

      const validZones = getValidDropZones(player.id);

      try {
        setBoardState(prev => ({
          ...prev,
          isDragging: true,
          draggedPlayer: player,
          validDropZones: validZones,
          dragPreview: { x: event.clientX || 0, y: event.clientY || 0 },
        }));

        // Set drag data
        event.dataTransfer.setData('text/plain', player.id);
        event.dataTransfer.effectAllowed = 'move';

        // Create enhanced drag image
        const dragImage = document.createElement('div');
        dragImage.className = 'drag-preview';
        const playerInitials = player.name
          ? player.name
              .split(' ')
              .map(n => n[0] || '')
              .join('')
              .slice(0, 2)
          : '??';

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
          ${playerInitials}
        </div>
      `;

        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);

        event.dataTransfer.setDragImage(dragImage, 24, 24);

        // Clean up drag image
        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 0);
      } catch (_error) {
        console.error('Failed to start drag operation:', _error);
      }
    },
    [drawingTool, getValidDropZones]
  );

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

  const handleSlotDragOver = useCallback(
    (slotId: string, event: React.DragEvent) => {
      event.preventDefault();

      if (!slotId || typeof slotId !== 'string') {
        // // console.warn('handleSlotDragOver: Invalid slotId', slotId);
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
    },
    [validateDrop]
  );

  const handleSlotDragLeave = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      dragOverSlot: null,
    }));
  }, []);

  const handleSlotDrop = useCallback(
    (slot: FormationSlot, team: Team, event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Validate slot data
      if (!slot || !slot.id) {
        // // console.warn('handleSlotDrop: Invalid slot data', slot);
        endDrag();
        return;
      }

      if (!team || (team !== 'home' && team !== 'away')) {
        // // console.warn('handleSlotDrop: Invalid team', team);
        endDrag();
        return;
      }

      const playerId = event.dataTransfer.getData('text/plain');
      if (!playerId) {
        // // console.warn('handleSlotDrop: No playerId from drag data');
        endDrag();
        return;
      }

      if (!validateDrop(playerId, slot.id)) {
        // // console.warn('handleSlotDrop: Validation failed', { playerId, slotId: slot.id });
        endDrag();
        return;
      }

      try {
        // If slot is occupied, handle swap or replacement
        if (slot.playerId && slot.playerId !== playerId) {
          // Show confirmation for swap
          const draggedPlayer = players?.find(p => p?.id === playerId);
          const occupyingPlayer = players?.find(p => p?.id === slot.playerId);

          if (draggedPlayer?.name && occupyingPlayer?.name) {
            const shouldSwap = window.confirm(
              `Swap ${draggedPlayer.name} with ${occupyingPlayer.name}?`
            );

            if (shouldSwap) {
              dispatch({
                type: 'SWAP_PLAYERS',
                payload: { sourcePlayerId: playerId, targetPlayerId: slot.playerId },
              });
            }
          } else {
            // // console.warn('handleSlotDrop: Cannot find player names for swap confirmation');
          }
        } else {
          // Assign player to empty slot
          dispatch({
            type: 'ASSIGN_PLAYER_TO_SLOT',
            payload: { slotId: slot.id, playerId, team },
          });
        }
      } catch (_error) {
        console.error('Failed to handle slot drop:', _error);
      } finally {
        endDrag();
      }
    },
    [validateDrop, players, dispatch, endDrag]
  );

  const handleFieldDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const playerId = event.dataTransfer.getData('text/plain');
      if (!playerId || typeof playerId !== 'string') {
        // // console.warn('handleFieldDrop: Invalid playerId from drag data', playerId);
        endDrag();
        return;
      }

      if (!validateDrop(playerId)) {
        // // console.warn('handleFieldDrop: Validation failed', playerId);
        endDrag();
        return;
      }

      if (positioningMode === 'snap') {
        // // console.warn('Field drops not allowed in snap mode');
        endDrag();
        return;
      }

      // Don't process if dropped on an interactive zone
      const target = event.target as HTMLElement;
      if (target && target.closest && target.closest('[data-is-interactive-zone="true"]')) {
        endDrag();
        return;
      }

      const currentTarget = event.currentTarget as HTMLElement;
      if (!currentTarget || !currentTarget.getBoundingClientRect) {
        // // console.warn('handleFieldDrop: Invalid currentTarget');
        endDrag();
        return;
      }

      const fieldRect = currentTarget.getBoundingClientRect();
      if (!fieldRect || fieldRect.width === 0 || fieldRect.height === 0) {
        // // console.warn('handleFieldDrop: Invalid field dimensions');
        endDrag();
        return;
      }

      const x = Math.max(
        5,
        Math.min(95, ((event.clientX - fieldRect.left) / fieldRect.width) * 100)
      );
      const y = Math.max(
        5,
        Math.min(95, ((event.clientY - fieldRect.top) / fieldRect.height) * 100)
      );

      if (isNaN(x) || isNaN(y)) {
        // // console.warn('handleFieldDrop: Invalid coordinates calculated', { x, y });
        endDrag();
        return;
      }

      try {
        dispatch({
          type: 'UPDATE_PLAYER_POSITION',
          payload: { playerId, position: { x, y } },
        });
      } catch (_error) {
        console.error('handleFieldDrop: Failed to update player position:', _error);
      } finally {
        endDrag();
      }
    },
    [validateDrop, positioningMode, dispatch, endDrag]
  );

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
