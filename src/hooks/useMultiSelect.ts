import { useState, useCallback, useRef, useMemo } from 'react';
import type { Position } from './useDragAndDrop';

/**
 * Selection mode types
 */
export type SelectionMode = 'single' | 'multiple' | 'rectangle';

/**
 * Selectable item interface
 */
export interface SelectableItem {
  id: string;
  position: Position;
  [key: string]: any;
}

/**
 * Rectangle selection bounds
 */
export interface SelectionRectangle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Group transformation types
 */
export type TransformationType = 'move' | 'rotate' | 'scale';

/**
 * Batch update operation
 */
export interface BatchUpdateOperation {
  type: 'property' | 'position' | 'swap';
  updates: Record<string, any>;
}

/**
 * Group alignment options
 */
export type AlignmentType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center-horizontal'
  | 'center-vertical';

/**
 * Distribution options
 */
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Hook options
 */
export interface UseMultiSelectOptions {
  items: SelectableItem[];
  maxSelectionCount?: number;
  enableRectangleSelection?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onGroupMove?: (selectedIds: string[], offset: Position) => void;
  onGroupRotate?: (selectedIds: string[], angle: number, center: Position) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

/**
 * Hook return interface
 */
export interface UseMultiSelectReturn {
  // Selection state
  selectedIds: string[];
  selectionMode: SelectionMode;
  selectionRectangle: SelectionRectangle | null;
  isSelecting: boolean;

  // Selection methods
  selectItem: (id: string, mode?: 'add' | 'toggle' | 'replace') => void;
  selectMultiple: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;

  // Rectangle selection
  startRectangleSelection: (position: Position) => void;
  updateRectangleSelection: (position: Position) => void;
  endRectangleSelection: () => void;

  // Group operations
  moveSelectedItems: (offset: Position) => void;
  rotateSelectedItems: (angle: number, center?: Position) => void;
  scaleSelectedItems: (scaleFactor: number, center?: Position) => void;

  // Alignment operations
  alignSelectedItems: (alignment: AlignmentType) => void;
  distributeSelectedItems: (distribution: DistributionType) => void;
  mirrorSelectedItems: (axis: 'horizontal' | 'vertical') => void;

  // Position operations
  swapPositions: (id1: string, id2: string) => void;
  batchUpdateProperties: (updates: Record<string, any>) => void;

  // Utility getters
  selectedItems: SelectableItem[];
  selectionCenter: Position | null;
  selectionBounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  hasSelection: boolean;
  selectionCount: number;
}

/**
 * Advanced multi-select hook with group operations
 *
 * @example
 * ```typescript
 * const {
 *   selectedIds,
 *   selectItem,
 *   selectMultiple,
 *   moveSelectedItems,
 *   rotateSelectedItems,
 *   alignSelectedItems
 * } = useMultiSelect({
 *   items: players,
 *   enableRectangleSelection: true,
 *   onSelectionChange: (ids) => console.log('Selected:', ids)
 * });
 * ```
 */
export function useMultiSelect(options: UseMultiSelectOptions): UseMultiSelectReturn {
  const {
    items,
    maxSelectionCount,
    enableRectangleSelection = true,
    onSelectionChange,
    onGroupMove,
    onGroupRotate,
    onBatchUpdate,
  } = options;

  // State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectionRectangle, setSelectionRectangle] = useState<SelectionRectangle | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Refs
  const rectangleStartRef = useRef<Position | null>(null);

  /**
   * Get selected items
   */
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  /**
   * Calculate selection center
   */
  const selectionCenter = useMemo((): Position | null => {
    if (selectedItems.length === 0) {
      return null;
    }

    const sumX = selectedItems.reduce((sum, item) => sum + item.position.x, 0);
    const sumY = selectedItems.reduce((sum, item) => sum + item.position.y, 0);

    return {
      x: sumX / selectedItems.length,
      y: sumY / selectedItems.length,
    };
  }, [selectedItems]);

  /**
   * Calculate selection bounds
   */
  const selectionBounds = useMemo(() => {
    if (selectedItems.length === 0) {
      return null;
    }

    const positions = selectedItems.map(item => item.position);

    return {
      minX: Math.min(...positions.map(p => p.x)),
      maxX: Math.max(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
      maxY: Math.max(...positions.map(p => p.y)),
    };
  }, [selectedItems]);

  /**
   * Check if has selection
   */
  const hasSelection = selectedIds.length > 0;

  /**
   * Get selection count
   */
  const selectionCount = selectedIds.length;

  /**
   * Select single item
   */
  const selectItem = useCallback(
    (id: string, mode: 'add' | 'toggle' | 'replace' = 'replace') => {
      setSelectedIds(prev => {
        let newSelection: string[];

        switch (mode) {
          case 'add':
            if (prev.includes(id)) {
              return prev;
            }
            newSelection = [...prev, id];
            break;

          case 'toggle':
            if (prev.includes(id)) {
              newSelection = prev.filter(selectedId => selectedId !== id);
            } else {
              newSelection = [...prev, id];
            }
            break;

          case 'replace':
          default:
            newSelection = [id];
            break;
        }

        // Enforce max selection count
        if (maxSelectionCount && newSelection.length > maxSelectionCount) {
          newSelection = newSelection.slice(-maxSelectionCount);
        }

        if (onSelectionChange && JSON.stringify(newSelection) !== JSON.stringify(prev)) {
          onSelectionChange(newSelection);
        }

        return newSelection;
      });
    },
    [maxSelectionCount, onSelectionChange],
  );

  /**
   * Select multiple items
   */
  const selectMultiple = useCallback(
    (ids: string[]) => {
      setSelectedIds(prev => {
        let newSelection = ids;

        // Enforce max selection count
        if (maxSelectionCount && newSelection.length > maxSelectionCount) {
          newSelection = newSelection.slice(0, maxSelectionCount);
        }

        if (onSelectionChange && JSON.stringify(newSelection) !== JSON.stringify(prev)) {
          onSelectionChange(newSelection);
        }

        return newSelection;
      });
    },
    [maxSelectionCount, onSelectionChange],
  );

  /**
   * Select all items
   */
  const selectAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    selectMultiple(allIds);
  }, [items, selectMultiple]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.length > 0 && onSelectionChange) {
        onSelectionChange([]);
      }
      return [];
    });
  }, [onSelectionChange]);

  /**
   * Toggle item selection
   */
  const toggleSelection = useCallback(
    (id: string) => {
      selectItem(id, 'toggle');
    },
    [selectItem],
  );

  /**
   * Start rectangle selection
   */
  const startRectangleSelection = useCallback(
    (position: Position) => {
      if (!enableRectangleSelection) {
        return;
      }

      rectangleStartRef.current = position;
      setIsSelecting(true);
      setSelectionMode('rectangle');
      setSelectionRectangle({
        startX: position.x,
        startY: position.y,
        endX: position.x,
        endY: position.y,
      });
    },
    [enableRectangleSelection],
  );

  /**
   * Update rectangle selection
   */
  const updateRectangleSelection = useCallback(
    (position: Position) => {
      if (!rectangleStartRef.current || !isSelecting) {
        return;
      }

      const start = rectangleStartRef.current;

      setSelectionRectangle({
        startX: start.x,
        startY: start.y,
        endX: position.x,
        endY: position.y,
      });

      // Find items within rectangle
      const minX = Math.min(start.x, position.x);
      const maxX = Math.max(start.x, position.x);
      const minY = Math.min(start.y, position.y);
      const maxY = Math.max(start.y, position.y);

      const itemsInRectangle = items.filter(item => {
        const { x, y } = item.position;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      });

      selectMultiple(itemsInRectangle.map(item => item.id));
    },
    [isSelecting, items, selectMultiple],
  );

  /**
   * End rectangle selection
   */
  const endRectangleSelection = useCallback(() => {
    rectangleStartRef.current = null;
    setIsSelecting(false);
    setSelectionRectangle(null);
    setSelectionMode(selectedIds.length > 1 ? 'multiple' : 'single');
  }, [selectedIds.length]);

  /**
   * Move selected items
   */
  const moveSelectedItems = useCallback(
    (offset: Position) => {
      if (selectedIds.length === 0) {
        return;
      }

      if (onGroupMove) {
        onGroupMove(selectedIds, offset);
      }
    },
    [selectedIds, onGroupMove],
  );

  /**
   * Rotate selected items around center
   */
  const rotateSelectedItems = useCallback(
    (angle: number, centerOverride?: Position) => {
      if (selectedIds.length === 0) {
        return;
      }

      const center = centerOverride || selectionCenter;
      if (!center) {
        return;
      }

      if (onGroupRotate) {
        onGroupRotate(selectedIds, angle, center);
      }
    },
    [selectedIds, selectionCenter, onGroupRotate],
  );

  /**
   * Scale selected items from center
   */
  const scaleSelectedItems = useCallback(
    (scaleFactor: number, centerOverride?: Position) => {
      if (selectedIds.length === 0 || !selectionCenter) {
        return;
      }

      const center = centerOverride || selectionCenter;

      // Calculate new positions
      const updates: Record<string, Position> = {};

      selectedItems.forEach(item => {
        const dx = item.position.x - center.x;
        const dy = item.position.y - center.y;

        updates[item.id] = {
          x: center.x + dx * scaleFactor,
          y: center.y + dy * scaleFactor,
        };
      });

      if (onBatchUpdate) {
        onBatchUpdate(updates);
      }
    },
    [selectedIds, selectedItems, selectionCenter, onBatchUpdate],
  );

  /**
   * Align selected items
   */
  const alignSelectedItems = useCallback(
    (alignment: AlignmentType) => {
      if (selectedIds.length === 0 || !selectionBounds) {
        return;
      }

      const updates: Record<string, Partial<Position>> = {};

      selectedItems.forEach(item => {
        switch (alignment) {
          case 'left':
            updates[item.id] = { x: selectionBounds.minX };
            break;
          case 'right':
            updates[item.id] = { x: selectionBounds.maxX };
            break;
          case 'top':
            updates[item.id] = { y: selectionBounds.minY };
            break;
          case 'bottom':
            updates[item.id] = { y: selectionBounds.maxY };
            break;
          case 'center-horizontal':
            updates[item.id] = { x: (selectionBounds.minX + selectionBounds.maxX) / 2 };
            break;
          case 'center-vertical':
            updates[item.id] = { y: (selectionBounds.minY + selectionBounds.maxY) / 2 };
            break;
        }
      });

      if (onBatchUpdate) {
        onBatchUpdate(updates);
      }
    },
    [selectedIds, selectedItems, selectionBounds, onBatchUpdate],
  );

  /**
   * Distribute selected items evenly
   */
  const distributeSelectedItems = useCallback(
    (distribution: DistributionType) => {
      if (selectedIds.length < 3 || !selectionBounds) {
        return;
      }

      const updates: Record<string, Partial<Position>> = {};

      if (distribution === 'horizontal') {
        const sorted = [...selectedItems].sort((a, b) => a.position.x - b.position.x);
        const spacing = (selectionBounds.maxX - selectionBounds.minX) / (sorted.length - 1);

        sorted.forEach((item, index) => {
          updates[item.id] = { x: selectionBounds.minX + spacing * index };
        });
      } else {
        const sorted = [...selectedItems].sort((a, b) => a.position.y - b.position.y);
        const spacing = (selectionBounds.maxY - selectionBounds.minY) / (sorted.length - 1);

        sorted.forEach((item, index) => {
          updates[item.id] = { y: selectionBounds.minY + spacing * index };
        });
      }

      if (onBatchUpdate) {
        onBatchUpdate(updates);
      }
    },
    [selectedIds, selectedItems, selectionBounds, onBatchUpdate],
  );

  /**
   * Mirror selected items
   */
  const mirrorSelectedItems = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedIds.length === 0 || !selectionCenter) {
        return;
      }

      const updates: Record<string, Position> = {};

      selectedItems.forEach(item => {
        if (axis === 'horizontal') {
          const distance = item.position.x - selectionCenter.x;
          updates[item.id] = {
            x: selectionCenter.x - distance,
            y: item.position.y,
          };
        } else {
          const distance = item.position.y - selectionCenter.y;
          updates[item.id] = {
            x: item.position.x,
            y: selectionCenter.y - distance,
          };
        }
      });

      if (onBatchUpdate) {
        onBatchUpdate(updates);
      }
    },
    [selectedIds, selectedItems, selectionCenter, onBatchUpdate],
  );

  /**
   * Swap positions of two items
   */
  const swapPositions = useCallback(
    (id1: string, id2: string) => {
      const item1 = items.find(item => item.id === id1);
      const item2 = items.find(item => item.id === id2);

      if (!item1 || !item2) {
        return;
      }

      const updates: Record<string, Position> = {
        [id1]: item2.position,
        [id2]: item1.position,
      };

      if (onBatchUpdate) {
        onBatchUpdate(updates);
      }
    },
    [items, onBatchUpdate],
  );

  /**
   * Batch update properties
   */
  const batchUpdateProperties = useCallback(
    (updates: Record<string, any>) => {
      if (selectedIds.length === 0) {
        return;
      }

      const batchUpdates: Record<string, any> = {};

      selectedIds.forEach(id => {
        batchUpdates[id] = updates;
      });

      if (onBatchUpdate) {
        onBatchUpdate(batchUpdates);
      }
    },
    [selectedIds, onBatchUpdate],
  );

  return {
    // Selection state
    selectedIds,
    selectionMode,
    selectionRectangle,
    isSelecting,

    // Selection methods
    selectItem,
    selectMultiple,
    selectAll,
    clearSelection,
    toggleSelection,

    // Rectangle selection
    startRectangleSelection,
    updateRectangleSelection,
    endRectangleSelection,

    // Group operations
    moveSelectedItems,
    rotateSelectedItems,
    scaleSelectedItems,

    // Alignment operations
    alignSelectedItems,
    distributeSelectedItems,
    mirrorSelectedItems,

    // Position operations
    swapPositions,
    batchUpdateProperties,

    // Utility getters
    selectedItems,
    selectionCenter,
    selectionBounds,
    hasSelection,
    selectionCount,
  };
}
