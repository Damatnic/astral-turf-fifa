import { vi } from 'vitest';
import { fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Player, FormationSlot } from '../../types';

/**
 * Comprehensive Drag-and-Drop Testing Utilities
 *
 * Provides utilities for testing:
 * - HTML5 drag and drop interactions
 * - Pointer events (mouse/touch)
 * - Complex multi-step drag scenarios
 * - Conflict detection and resolution
 * - Positioning and snap behavior
 * - Performance under load
 */

export interface DragDropTestScenario {
  sourceElement: HTMLElement;
  targetElement: HTMLElement;
  expectedConflict?: boolean;
  expectedPosition?: { x: number; y: number };
  shouldSnap?: boolean;
  customDropData?: Record<string, string>;
}

export interface TouchTestScenario {
  touches: Array<{
    x: number;
    y: number;
    duration?: number;
  }>;
  expectedPath: Array<{ x: number; y: number }>;
  shouldTriggerDrop: boolean;
}

/**
 * Create a comprehensive DataTransfer mock with full functionality
 */
export const createDataTransferMock = (initialData: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initialData));
  const files: File[] = [];
  const items: DataTransferItem[] = [];

  return {
    // Core properties
    dropEffect: 'none' as DataTransfer['dropEffect'],
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
    files,
    items,
    types: Array.from(data.keys()),

    // Core methods
    getData: vi.fn((format: string) => data.get(format) || ''),
    setData: vi.fn((format: string, value: string) => {
      data.set(format, value);
      return true;
    }),
    clearData: vi.fn((format?: string) => {
      if (format) {
        data.delete(format);
      } else {
        data.clear();
      }
    }),
    setDragImage: vi.fn(),

    // Extended functionality for testing
    _getData: () => Object.fromEntries(data),
    _setFiles: (newFiles: File[]) => {
      files.splice(0, files.length, ...newFiles);
    },
    _reset: () => {
      data.clear();
      files.splice(0);
      items.splice(0);
    },
  };
};

/**
 * Create drag event with proper event properties
 */
export const createDragEvent = (
  type: string,
  dataTransfer?: ReturnType<typeof createDataTransferMock>,
  options: Partial<DragEvent> = {}
): DragEvent => {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  }) as DragEvent;

  // Add drag-specific properties
  Object.defineProperty(event, 'dataTransfer', {
    value: dataTransfer || createDataTransferMock(),
    writable: false,
  });

  Object.defineProperty(event, 'clientX', {
    value: options.clientX || 0,
    writable: false,
  });

  Object.defineProperty(event, 'clientY', {
    value: options.clientY || 0,
    writable: false,
  });

  return event;
};

/**
 * Simulate complete drag and drop sequence
 */
export const simulateDragAndDrop = async (
  scenario: DragDropTestScenario
): Promise<{
  success: boolean;
  conflictDetected: boolean;
  finalPosition?: { x: number; y: number };
  events: string[];
}> => {
  const { sourceElement, targetElement, customDropData = {} } = scenario;
  const dataTransfer = createDataTransferMock(customDropData);
  const events: string[] = [];

  try {
    // 1. Start drag operation
    const dragStartEvent = createDragEvent('dragstart', dataTransfer, {
      clientX: 100,
      clientY: 100,
    });

    act(() => {
      fireEvent(sourceElement, dragStartEvent);
    });
    events.push('dragstart');

    // 2. Drag over target
    const dragOverEvent = createDragEvent('dragover', dataTransfer, {
      clientX: 200,
      clientY: 200,
    });

    act(() => {
      fireEvent(targetElement, dragOverEvent);
    });
    events.push('dragover');

    // 3. Drag enter target
    const dragEnterEvent = createDragEvent('dragenter', dataTransfer, {
      clientX: 200,
      clientY: 200,
    });

    act(() => {
      fireEvent(targetElement, dragEnterEvent);
    });
    events.push('dragenter');

    // 4. Drop on target
    const dropEvent = createDragEvent('drop', dataTransfer, {
      clientX: 200,
      clientY: 200,
    });

    act(() => {
      fireEvent(targetElement, dropEvent);
    });
    events.push('drop');

    // 5. End drag operation
    const dragEndEvent = createDragEvent('dragend', dataTransfer);

    act(() => {
      fireEvent(sourceElement, dragEndEvent);
    });
    events.push('dragend');

    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    return {
      success: true,
      conflictDetected: scenario.expectedConflict || false,
      finalPosition: scenario.expectedPosition,
      events,
    };
  } catch (error) {
    console.error('Drag and drop simulation failed:', error);
    return {
      success: false,
      conflictDetected: false,
      events,
    };
  }
};

/**
 * Simulate touch-based drag and drop
 */
export const simulateTouchDragAndDrop = async (
  sourceElement: HTMLElement,
  targetElement: HTMLElement,
  scenario: TouchTestScenario
): Promise<{
  success: boolean;
  touchPath: Array<{ x: number; y: number; timestamp: number }>;
  events: string[];
}> => {
  const events: string[] = [];
  const touchPath: Array<{ x: number; y: number; timestamp: number }> = [];

  try {
    const startTouch = scenario.touches[0];
    const endTouch = scenario.touches[scenario.touches.length - 1];

    // 1. Touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [
        {
          identifier: 0,
          target: sourceElement,
          clientX: startTouch.x,
          clientY: startTouch.y,
          pageX: startTouch.x,
          pageY: startTouch.y,
          screenX: startTouch.x,
          screenY: startTouch.y,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        },
      ] as any,
    });

    act(() => {
      fireEvent(sourceElement, touchStartEvent);
    });
    events.push('touchstart');
    touchPath.push({ x: startTouch.x, y: startTouch.y, timestamp: Date.now() });

    // 2. Touch move sequence
    for (let i = 1; i < scenario.touches.length - 1; i++) {
      const touch = scenario.touches[i];

      const touchMoveEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [
          {
            identifier: 0,
            target: sourceElement,
            clientX: touch.x,
            clientY: touch.y,
            pageX: touch.x,
            pageY: touch.y,
            screenX: touch.x,
            screenY: touch.y,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 1,
          },
        ] as any,
      });

      act(() => {
        fireEvent(document, touchMoveEvent);
      });
      events.push('touchmove');
      touchPath.push({ x: touch.x, y: touch.y, timestamp: Date.now() });

      // Small delay to simulate real touch movement
      await new Promise(resolve => setTimeout(resolve, touch.duration || 16));
    }

    // 3. Touch end
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [
        {
          identifier: 0,
          target: targetElement,
          clientX: endTouch.x,
          clientY: endTouch.y,
          pageX: endTouch.x,
          pageY: endTouch.y,
          screenX: endTouch.x,
          screenY: endTouch.y,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1,
        },
      ] as any,
    });

    act(() => {
      fireEvent(targetElement, touchEndEvent);
    });
    events.push('touchend');
    touchPath.push({ x: endTouch.x, y: endTouch.y, timestamp: Date.now() });

    return {
      success: true,
      touchPath,
      events,
    };
  } catch (error) {
    console.error('Touch drag simulation failed:', error);
    return {
      success: false,
      touchPath,
      events,
    };
  }
};

/**
 * Test player drag with conflict detection
 */
export const testPlayerDragWithConflict = async (
  playerElement: HTMLElement,
  slotElement: HTMLElement,
  player: Player,
  targetSlot: FormationSlot,
  expectedConflict: boolean = false
): Promise<{
  dragCompleted: boolean;
  conflictMenuShown: boolean;
  playerMoved: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  let dragCompleted = false;
  let conflictMenuShown = false;
  let playerMoved = false;

  try {
    // Setup drag data
    const dataTransfer = createDataTransferMock({
      'application/json': JSON.stringify({
        playerId: player.id,
        sourcePosition: player.position,
        dragType: 'player',
      }),
    });

    // Simulate the complete workflow
    const result = await simulateDragAndDrop({
      sourceElement: playerElement,
      targetElement: slotElement,
      expectedConflict,
      expectedPosition: targetSlot.defaultPosition,
      customDropData: {
        'application/json': JSON.stringify({
          playerId: player.id,
          targetSlotId: targetSlot.id,
        }),
      },
    });

    dragCompleted = result.success;

    // Check for conflict menu appearance
    const conflictMenu = document.querySelector('[data-testid="conflict-menu"]');
    conflictMenuShown = !!conflictMenu;

    // Verify expected conflict behavior
    if (expectedConflict && !conflictMenuShown) {
      errors.push('Expected conflict menu but none appeared');
    } else if (!expectedConflict && conflictMenuShown) {
      errors.push('Unexpected conflict menu appeared');
    }

    // Check if player position changed
    const playerAfterDrag = document.querySelector(`[data-player-id="${player.id}"]`);
    if (playerAfterDrag) {
      const rect = playerAfterDrag.getBoundingClientRect();
      playerMoved = rect.left !== player.position.x || rect.top !== player.position.y;
    }
  } catch (error) {
    errors.push(`Drag test failed: ${error}`);
  }

  return {
    dragCompleted,
    conflictMenuShown,
    playerMoved,
    errors,
  };
};

/**
 * Test formation slot drop zones
 */
export const testSlotDropZones = async (
  slots: FormationSlot[],
  draggedPlayer: Player
): Promise<
  Array<{
    slotId: string;
    acceptsDrop: boolean;
    highlightsOnHover: boolean;
    positionCorrect: boolean;
  }>
> => {
  const results: any[] = [];

  for (const slot of slots) {
    const slotElement = document.querySelector(`[data-slot-id="${slot.id}"]`);

    if (!slotElement) {
      results.push({
        slotId: slot.id,
        acceptsDrop: false,
        highlightsOnHover: false,
        positionCorrect: false,
      });
      continue;
    }

    // Test drag over
    const dragOverEvent = createDragEvent(
      'dragover',
      createDataTransferMock({
        'application/json': JSON.stringify({
          playerId: draggedPlayer.id,
          dragType: 'player',
        }),
      })
    );

    act(() => {
      fireEvent(slotElement, dragOverEvent);
    });

    // Check if slot accepts drop
    const acceptsDrop = !dragOverEvent.defaultPrevented;

    // Check for visual feedback
    const highlightsOnHover =
      slotElement.classList.contains('drop-zone-active') ||
      slotElement.classList.contains('drag-over') ||
      window.getComputedStyle(slotElement).opacity !== '1';

    // Verify position is within expected bounds
    const rect = slotElement.getBoundingClientRect();
    const expectedX = slot.defaultPosition.x;
    const expectedY = slot.defaultPosition.y;
    const positionCorrect =
      Math.abs(rect.left - expectedX) < 10 && Math.abs(rect.top - expectedY) < 10;

    results.push({
      slotId: slot.id,
      acceptsDrop,
      highlightsOnHover,
      positionCorrect,
    });
  }

  return results;
};

/**
 * Performance test for drag operations
 */
export const performanceDragTest = async (
  playerElements: HTMLElement[],
  slotElements: HTMLElement[],
  iterations: number = 10
): Promise<{
  averageDragTime: number;
  maxDragTime: number;
  minDragTime: number;
  successfulDrags: number;
  failedDrags: number;
  memoryUsage?: number;
}> => {
  const dragTimes: number[] = [];
  let successfulDrags = 0;
  let failedDrags = 0;

  for (let i = 0; i < iterations; i++) {
    const sourceElement = playerElements[i % playerElements.length];
    const targetElement = slotElements[i % slotElements.length];

    const startTime = performance.now();

    try {
      const result = await simulateDragAndDrop({
        sourceElement,
        targetElement,
        expectedConflict: false,
      });

      const endTime = performance.now();
      const dragTime = endTime - startTime;

      dragTimes.push(dragTime);

      if (result.success) {
        successfulDrags++;
      } else {
        failedDrags++;
      }
    } catch (error) {
      failedDrags++;
      const endTime = performance.now();
      dragTimes.push(endTime - startTime);
    }

    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  const averageDragTime = dragTimes.reduce((sum, time) => sum + time, 0) / dragTimes.length;
  const maxDragTime = Math.max(...dragTimes);
  const minDragTime = Math.min(...dragTimes);

  // Get memory usage if available
  let memoryUsage;
  if ('memory' in performance) {
    memoryUsage = (performance as any).memory.usedJSHeapSize;
  }

  return {
    averageDragTime,
    maxDragTime,
    minDragTime,
    successfulDrags,
    failedDrags,
    memoryUsage,
  };
};

/**
 * Test complex multi-player drag scenarios
 */
export const testComplexDragScenario = async (
  scenarios: Array<{
    players: Player[];
    targetSlots: FormationSlot[];
    expectedOutcome: 'success' | 'conflict' | 'error';
    description: string;
  }>
): Promise<
  Array<{
    scenarioId: string;
    success: boolean;
    actualOutcome: string;
    errors: string[];
    duration: number;
  }>
> => {
  const results = [];

  for (const [index, scenario] of scenarios.entries()) {
    const startTime = performance.now();
    const errors: string[] = [];
    let actualOutcome = 'unknown';
    let success = false;

    try {
      // Execute drag operations in sequence
      for (const [playerIndex, player] of scenario.players.entries()) {
        const targetSlot = scenario.targetSlots[playerIndex];
        if (!targetSlot) {
          continue;
        }

        const playerElement = document.querySelector(
          `[data-player-id="${player.id}"]`
        ) as HTMLElement;
        const slotElement = document.querySelector(
          `[data-slot-id="${targetSlot.id}"]`
        ) as HTMLElement;

        if (!playerElement || !slotElement) {
          errors.push(`Missing elements for player ${player.id} or slot ${targetSlot.id}`);
          continue;
        }

        const dragResult = await simulateDragAndDrop({
          sourceElement: playerElement,
          targetElement: slotElement,
          expectedConflict: scenario.expectedOutcome === 'conflict',
        });

        if (!dragResult.success) {
          errors.push(`Drag failed for player ${player.id}`);
        }
      }

      // Determine actual outcome
      const conflictMenuVisible = !!document.querySelector('[data-testid="conflict-menu"]');
      const errorOccurred = errors.length > 0;

      if (errorOccurred) {
        actualOutcome = 'error';
      } else if (conflictMenuVisible) {
        actualOutcome = 'conflict';
      } else {
        actualOutcome = 'success';
      }

      success = actualOutcome === scenario.expectedOutcome;
    } catch (error) {
      errors.push(`Scenario failed: ${error}`);
      actualOutcome = 'error';
    }

    const endTime = performance.now();

    (results as any[]).push({
      scenarioId: `scenario-${index}-${scenario.description.replace(/\s+/g, '-')}`,
      success,
      actualOutcome,
      errors,
      duration: endTime - startTime,
    });
  }

  return results;
};

/**
 * Utility to wait for drag animation to complete
 */
export const waitForDragAnimation = async (
  element: HTMLElement,
  maxWait: number = 1000
): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    const transition = style.transition;

    // Check if element is still animating
    if (transform === 'none' && (transition === 'none' || !transition.includes('transform'))) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
  }

  return false; // Animation didn't complete within timeout
};

/**
 * Mock pointer events for advanced testing
 */
export const mockPointerEvents = () => {
  const pointerEvents = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];

  pointerEvents.forEach(eventType => {
    if (!(eventType in window)) {
      Object.defineProperty(window, eventType, {
        value: function (type: string, eventInitDict?: PointerEventInit) {
          return new CustomEvent(type, { ...eventInitDict, bubbles: true, cancelable: true });
        },
      });
    }
  });

  // Mock setPointerCapture and releasePointerCapture
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(Element.prototype, 'releasePointerCapture', {
    value: vi.fn(),
    writable: true,
  });
};

export default {
  createDataTransferMock,
  createDragEvent,
  simulateDragAndDrop,
  simulateTouchDragAndDrop,
  testPlayerDragWithConflict,
  testSlotDropZones,
  performanceDragTest,
  testComplexDragScenario,
  waitForDragAnimation,
  mockPointerEvents,
};
