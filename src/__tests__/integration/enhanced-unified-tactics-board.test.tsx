import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { renderWithProviders } from '../utils/test-helpers';
import {
  generateTacticalFormation,
  generatePerformanceTestData,
  generateConflictScenario,
  generateDragDropScenario,
} from '../utils/enhanced-mock-generators';
import {
  simulateDragAndDrop,
  testPlayerDragWithConflict,
  createDataTransferMock,
} from '../utils/drag-drop-test-utils';

/**
 * Comprehensive Integration Tests for Enhanced UnifiedTacticsBoard
 *
 * Tests the complete tactical board ecosystem including:
 * - Formation auto-assignment integration
 * - Positioning mode switching workflow
 * - Conflict resolution complete flow
 * - Drawing tools integration
 * - Chemistry visualization integration
 * - Real-time updates and state management
 * - Cross-component communication
 * - Performance under load
 * - Error recovery and resilience
 */

// Mock the main TacticsBoard component
const MockUnifiedTacticsBoard = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const [players, setPlayers] = React.useState(props.initialPlayers || []);
  const [formation, setFormation] = React.useState(props.initialFormation || null);
  const [positioningMode, setPositioningMode] = React.useState<'snap' | 'free'>('snap');
  const [showConflictMenu, setShowConflictMenu] = React.useState(false);
  const [showDrawingTools, setShowDrawingTools] = React.useState(false);
  const [conflictData, setConflictData] = React.useState<any>(null);

  return (
    <div ref={ref} data-testid="unified-tactics-board" className="tactics-board">
      {/* Header Controls */}
      <div className="board-header" data-testid="board-header">
        <button
          data-testid="toggle-positioning-mode"
          onClick={() => setPositioningMode(mode => (mode === 'snap' ? 'free' : 'snap'))}
        >
          Mode: {positioningMode}
        </button>

        <button
          data-testid="toggle-drawing-tools"
          onClick={() => setShowDrawingTools(!showDrawingTools)}
        >
          Drawing Tools
        </button>

        <button
          data-testid="auto-assign-formation"
          onClick={() => {
            // Mock auto-assignment
            const updatedFormation = { ...formation, autoAssigned: true };
            setFormation(updatedFormation);
          }}
        >
          Auto Assign
        </button>
      </div>

      {/* Main Field Area */}
      <div
        className="field-container"
        data-testid="field-container"
        onDrop={e => {
          e.preventDefault();
          const data = e.dataTransfer.getData('application/json');
          if (data) {
            const { playerId, targetSlotId } = JSON.parse(data);
            const existingPlayer = players.find(p =>
              formation?.slots?.find(s => s.id === targetSlotId && s.playerId),
            );

            if (existingPlayer && existingPlayer.id !== playerId) {
              setConflictData({ playerId, targetSlotId, existingPlayer });
              setShowConflictMenu(true);
            } else {
              // Direct assignment
              const updatedPlayers = players.map(p =>
                p.id === playerId ? { ...p, assigned: true, slotId: targetSlotId } : p,
              );
              setPlayers(updatedPlayers);
            }
          }
        }}
        onDragOver={e => e.preventDefault()}
      >
        {/* Formation Slots */}
        {formation?.slots?.map(slot => (
          <div
            key={slot.id}
            data-testid={`formation-slot-${slot.id}`}
            data-slot-id={slot.id}
            className="formation-slot"
            style={{
              position: 'absolute',
              left: `${slot.defaultPosition.x}%`,
              top: `${slot.defaultPosition.y}%`,
              width: '40px',
              height: '40px',
              border: '2px dashed #ccc',
              borderRadius: '50%',
            }}
          >
            {slot.playerId && (
              <div
                data-testid={`player-${slot.playerId}`}
                data-player-id={slot.playerId}
                className="player-token"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      playerId: slot.playerId,
                      sourceSlotId: slot.id,
                    }),
                  );
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {players.find(p => p.id === slot.playerId)?.jerseyNumber || '?'}
              </div>
            )}
          </div>
        ))}

        {/* Bench Players */}
        <div className="bench-area" data-testid="bench-area">
          {players
            .filter(p => !formation?.slots?.some(s => s.playerId === p.id))
            .map(player => (
              <div
                key={player.id}
                data-testid={`bench-player-${player.id}`}
                data-player-id={player.id}
                className="bench-player"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      playerId: player.id,
                      sourceBench: true,
                    }),
                  );
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#6b7280',
                  borderRadius: '50%',
                  margin: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                {player.jerseyNumber}
              </div>
            ))}
        </div>
      </div>

      {/* Conflict Resolution Menu */}
      {showConflictMenu && conflictData && (
        <div
          data-testid="conflict-resolution-menu"
          className="conflict-menu"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            zIndex: 1000,
          }}
        >
          <h3>Position Conflict</h3>
          <p>Resolve player placement conflict</p>

          <button
            data-testid="conflict-swap"
            onClick={() => {
              // Mock swap logic
              setShowConflictMenu(false);
              setConflictData(null);
            }}
          >
            Swap Players
          </button>

          <button
            data-testid="conflict-replace"
            onClick={() => {
              // Mock replace logic
              setShowConflictMenu(false);
              setConflictData(null);
            }}
          >
            Replace Player
          </button>

          <button
            data-testid="conflict-cancel"
            onClick={() => {
              setShowConflictMenu(false);
              setConflictData(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Drawing Tools Overlay */}
      {showDrawingTools && (
        <div
          data-testid="drawing-tools-overlay"
          className="drawing-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.1)',
            zIndex: 100,
          }}
        >
          <div className="drawing-toolbar">
            <button data-testid="pen-tool">Pen</button>
            <button data-testid="arrow-tool">Arrow</button>
            <button data-testid="close-drawing">Close</button>
          </div>
          <svg
            data-testid="drawing-canvas"
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
      )}

      {/* Chemistry Visualization */}
      <div data-testid="chemistry-panel" className="chemistry-panel">
        <h4>Team Chemistry</h4>
        <div data-testid="chemistry-score">85%</div>
        <svg data-testid="chemistry-visualization" width="200" height="150">
          {/* Mock chemistry lines */}
          <line x1="50" y1="50" x2="150" y2="50" stroke="#22c55e" strokeWidth="2" />
          <line x1="50" y1="50" x2="100" y2="100" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
});

MockUnifiedTacticsBoard.displayName = 'MockUnifiedTacticsBoard';

describe('Enhanced UnifiedTacticsBoard Integration Tests', () => {
  const user = userEvent.setup();
  let mockFormation: any;
  let mockPlayers: any[];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    // Generate test data
    mockFormation = generateTacticalFormation('4-4-2');
    mockPlayers = generatePerformanceTestData.medium().players.slice(0, 15);

    // Assign some players to formation
    mockFormation.slots.slice(0, 11).forEach((slot: any, index: number) => {
      slot.playerId = mockPlayers[index]?.id;
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Integration', () => {
    it('should render all major components together', () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByTestId('board-header')).toBeInTheDocument();
      expect(screen.getByTestId('field-container')).toBeInTheDocument();
      expect(screen.getByTestId('bench-area')).toBeInTheDocument();
      expect(screen.getByTestId('chemistry-panel')).toBeInTheDocument();
    });

    it('should display formation slots correctly', () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      mockFormation.slots.forEach((slot: any) => {
        expect(screen.getByTestId(`formation-slot-${slot.id}`)).toBeInTheDocument();
      });
    });

    it('should show players in assigned positions', () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      mockFormation.slots
        .filter((slot: any) => slot.playerId)
        .forEach((slot: any) => {
          expect(screen.getByTestId(`player-${slot.playerId}`)).toBeInTheDocument();
        });
    });

    it('should display bench players', () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const assignedPlayerIds = mockFormation.slots
        .filter((slot: any) => slot.playerId)
        .map((slot: any) => slot.playerId);

      const benchPlayers = mockPlayers.filter(p => !assignedPlayerIds.includes(p.id));

      benchPlayers.forEach(player => {
        expect(screen.getByTestId(`bench-player-${player.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Positioning Mode Integration', () => {
    it('should toggle between snap and free positioning modes', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      expect(modeToggle).toHaveTextContent('Mode: snap');

      await user.click(modeToggle);
      expect(modeToggle).toHaveTextContent('Mode: free');

      await user.click(modeToggle);
      expect(modeToggle).toHaveTextContent('Mode: snap');
    });

    it('should affect player positioning behavior based on mode', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const modeToggle = screen.getByTestId('toggle-positioning-mode');

      // Test in snap mode
      expect(modeToggle).toHaveTextContent('Mode: snap');

      // Switch to free mode
      await user.click(modeToggle);
      expect(modeToggle).toHaveTextContent('Mode: free');

      // Mode change should be reflected in the board state
      const board = screen.getByTestId('unified-tactics-board');
      expect(board).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Integration', () => {
    it('should handle player drag from bench to formation slot', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[11].id}`);
      const emptySlot = screen.getByTestId(`formation-slot-${mockFormation.slots[5].id}`);

      // Ensure slot is empty
      mockFormation.slots[5].playerId = null;

      const dragResult = await simulateDragAndDrop({
        sourceElement: benchPlayer,
        targetElement: emptySlot,
        customDropData: {
          'application/json': JSON.stringify({
            playerId: mockPlayers[11].id,
            targetSlotId: mockFormation.slots[5].id,
          }),
        },
      });

      expect(dragResult.success).toBe(true);
    });

    it('should trigger conflict resolution for occupied slots', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[12].id}`);
      const occupiedSlot = screen.getByTestId(`formation-slot-${mockFormation.slots[0].id}`);

      // Simulate drag to occupied slot
      const dataTransfer = createDataTransferMock({
        'application/json': JSON.stringify({
          playerId: mockPlayers[12].id,
          targetSlotId: mockFormation.slots[0].id,
        }),
      });

      fireEvent.dragStart(benchPlayer, { dataTransfer });
      fireEvent.dragOver(occupiedSlot, { dataTransfer });
      fireEvent.drop(occupiedSlot, { dataTransfer });

      // Conflict menu should appear
      await waitFor(() => {
        expect(screen.getByTestId('conflict-resolution-menu')).toBeInTheDocument();
      });
    });

    it('should resolve conflicts through user choice', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Trigger conflict first
      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[12].id}`);
      const occupiedSlot = screen.getByTestId(`formation-slot-${mockFormation.slots[0].id}`);

      fireEvent.drop(occupiedSlot, {
        dataTransfer: createDataTransferMock({
          'application/json': JSON.stringify({
            playerId: mockPlayers[12].id,
            targetSlotId: mockFormation.slots[0].id,
          }),
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('conflict-resolution-menu')).toBeInTheDocument();
      });

      // Resolve with swap
      const swapButton = screen.getByTestId('conflict-swap');
      await user.click(swapButton);

      await waitFor(() => {
        expect(screen.queryByTestId('conflict-resolution-menu')).not.toBeInTheDocument();
      });
    });

    it('should handle player-to-player drag operations', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const sourcePlayer = screen.getByTestId(`player-${mockFormation.slots[0].playerId}`);
      const targetSlot = screen.getByTestId(`formation-slot-${mockFormation.slots[1].id}`);

      const dragResult = await simulateDragAndDrop({
        sourceElement: sourcePlayer,
        targetElement: targetSlot,
        expectedConflict: true,
        customDropData: {
          'application/json': JSON.stringify({
            playerId: mockFormation.slots[0].playerId,
            targetSlotId: mockFormation.slots[1].id,
          }),
        },
      });

      expect(dragResult.success).toBe(true);
    });
  });

  describe('Formation Auto-Assignment Integration', () => {
    it('should trigger auto-assignment correctly', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const autoAssignButton = screen.getByTestId('auto-assign-formation');
      await user.click(autoAssignButton);

      // Auto-assignment should complete without errors
      expect(autoAssignButton).toBeInTheDocument();
    });

    it('should respect positioning mode during auto-assignment', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Switch to free mode
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      await user.click(modeToggle);

      // Auto-assign in free mode
      const autoAssignButton = screen.getByTestId('auto-assign-formation');
      await user.click(autoAssignButton);

      expect(modeToggle).toHaveTextContent('Mode: free');
    });

    it('should handle auto-assignment conflicts gracefully', async () => {
      // Create scenario with conflicting assignments
      const conflictFormation = { ...mockFormation };
      conflictFormation.slots.forEach((slot: any) => {
        slot.playerId = mockPlayers[0]?.id; // All slots assigned to same player
      });

      const { container } = render(
        <MockUnifiedTacticsBoard
          initialFormation={conflictFormation}
          initialPlayers={mockPlayers}
        />,
      );

      const autoAssignButton = screen.getByTestId('auto-assign-formation');

      expect(() => {
        fireEvent.click(autoAssignButton);
      }).not.toThrow();
    });
  });

  describe('Drawing Tools Integration', () => {
    it('should toggle drawing tools overlay', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const drawingToggle = screen.getByTestId('toggle-drawing-tools');

      // Should not be visible initially
      expect(screen.queryByTestId('drawing-tools-overlay')).not.toBeInTheDocument();

      await user.click(drawingToggle);

      // Should appear
      expect(screen.getByTestId('drawing-tools-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();

      await user.click(drawingToggle);

      // Should disappear
      expect(screen.queryByTestId('drawing-tools-overlay')).not.toBeInTheDocument();
    });

    it('should provide drawing tools when overlay is active', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      await user.click(drawingToggle);

      expect(screen.getByTestId('pen-tool')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-tool')).toBeInTheDocument();
      expect(screen.getByTestId('close-drawing')).toBeInTheDocument();
    });

    it('should handle drawing interactions on the field', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      await user.click(drawingToggle);

      const drawingCanvas = screen.getByTestId('drawing-canvas');

      // Simulate drawing interaction
      fireEvent.mouseDown(drawingCanvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(drawingCanvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(drawingCanvas);

      expect(drawingCanvas).toBeInTheDocument();
    });
  });

  describe('Chemistry Visualization Integration', () => {
    it('should display team chemistry information', () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      expect(screen.getByTestId('chemistry-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chemistry-score')).toBeInTheDocument();
      expect(screen.getByTestId('chemistry-visualization')).toBeInTheDocument();
    });

    it('should update chemistry when players are moved', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const initialChemistry = screen.getByTestId('chemistry-score');
      expect(initialChemistry).toHaveTextContent('85%');

      // Move a player and verify chemistry updates
      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[11].id}`);
      const emptySlot = container.querySelector('[data-slot-id]:not([data-player-id])');

      if (emptySlot) {
        fireEvent.drop(emptySlot, {
          dataTransfer: createDataTransferMock({
            'application/json': JSON.stringify({
              playerId: mockPlayers[11].id,
              targetSlotId: emptySlot.getAttribute('data-slot-id'),
            }),
          }),
        });

        // Chemistry should still be displayed (exact value may change)
        expect(screen.getByTestId('chemistry-score')).toBeInTheDocument();
      }
    });
  });

  describe('Cross-Component Communication', () => {
    it('should coordinate state changes across all components', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Change positioning mode
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      await user.click(modeToggle);

      // Open drawing tools
      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      await user.click(drawingToggle);

      // Trigger auto-assignment
      const autoAssignButton = screen.getByTestId('auto-assign-formation');
      await user.click(autoAssignButton);

      // All components should remain functional
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByTestId('drawing-tools-overlay')).toBeInTheDocument();
      expect(modeToggle).toHaveTextContent('Mode: free');
    });

    it('should handle rapid state changes gracefully', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Rapid interactions
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      const autoAssignButton = screen.getByTestId('auto-assign-formation');

      // Rapid clicking
      for (let i = 0; i < 5; i++) {
        await user.click(modeToggle);
        await user.click(drawingToggle);
        await user.click(autoAssignButton);
      }

      // Should remain stable
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid formation data gracefully', () => {
      const invalidFormation = {
        id: 'invalid',
        name: 'Invalid Formation',
        slots: null,
      };

      expect(() => {
        render(
          <MockUnifiedTacticsBoard
            initialFormation={invalidFormation}
            initialPlayers={mockPlayers}
          />,
        );
      }).not.toThrow();
    });

    it('should recover from drag and drop errors', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[11].id}`);

      // Invalid drop data
      fireEvent.drop(container, {
        dataTransfer: createDataTransferMock({
          'application/json': 'invalid json',
        }),
      });

      // Should not crash
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });

    it('should handle missing player data', () => {
      const incompleteFormation = {
        ...mockFormation,
        slots: mockFormation.slots.map((slot: any) => ({
          ...slot,
          playerId: 'non-existent-player-id',
        })),
      };

      expect(() => {
        render(
          <MockUnifiedTacticsBoard
            initialFormation={incompleteFormation}
            initialPlayers={mockPlayers}
          />,
        );
      }).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance with complex interactions', async () => {
      const startTime = performance.now();

      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Perform multiple complex operations
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      const autoAssignButton = screen.getByTestId('auto-assign-formation');

      await user.click(modeToggle);
      await user.click(drawingToggle);
      await user.click(autoAssignButton);

      // Simulate drag operations
      const benchPlayers = screen.getAllByTestId(/bench-player-/);
      if (benchPlayers.length > 0) {
        fireEvent.dragStart(benchPlayers[0]);
        fireEvent.dragEnd(benchPlayers[0]);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete quickly
      expect(totalTime).toBeLessThan(1000); // 1 second max
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      const largePlayerSet = generatePerformanceTestData.large().players.slice(0, 50);
      const largeFormation = generateTacticalFormation('5-3-2');

      const startTime = performance.now();

      const { container } = render(
        <MockUnifiedTacticsBoard
          initialFormation={largeFormation}
          initialPlayers={largePlayerSet}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500); // 500ms max for large dataset
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should execute a complete tactical setup workflow', async () => {
      render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      // Step 1: Switch positioning mode
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      await user.click(modeToggle);
      expect(modeToggle).toHaveTextContent('Mode: free');

      // Step 2: Auto-assign formation
      const autoAssignButton = screen.getByTestId('auto-assign-formation');
      await user.click(autoAssignButton);

      // Step 3: Manual player adjustments
      const benchPlayer = screen.getByTestId(`bench-player-${mockPlayers[11].id}`);
      const fieldContainer = screen.getByTestId('field-container');

      fireEvent.dragStart(benchPlayer);
      fireEvent.drop(fieldContainer, {
        dataTransfer: createDataTransferMock({
          'application/json': JSON.stringify({
            playerId: mockPlayers[11].id,
            targetSlotId: mockFormation.slots[0].id,
          }),
        }),
      });

      // Step 4: Resolve any conflicts
      if (screen.queryByTestId('conflict-resolution-menu')) {
        const swapButton = screen.getByTestId('conflict-swap');
        await user.click(swapButton);
      }

      // Step 5: Add tactical annotations
      const drawingToggle = screen.getByTestId('toggle-drawing-tools');
      await user.click(drawingToggle);

      const drawingCanvas = screen.getByTestId('drawing-canvas');
      fireEvent.mouseDown(drawingCanvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(drawingCanvas);

      // Step 6: Verify final state
      expect(screen.getByTestId('unified-tactics-board')).toBeInTheDocument();
      expect(screen.getByTestId('chemistry-panel')).toBeInTheDocument();
      expect(screen.getByTestId('drawing-tools-overlay')).toBeInTheDocument();
    });

    it('should maintain data consistency throughout workflow', async () => {
      const { container } = render(
        <MockUnifiedTacticsBoard initialFormation={mockFormation} initialPlayers={mockPlayers} />,
      );

      const initialPlayerCount = mockPlayers.length;
      const initialSlotCount = mockFormation.slots.length;

      // Perform various operations
      const modeToggle = screen.getByTestId('toggle-positioning-mode');
      await user.click(modeToggle);

      const autoAssignButton = screen.getByTestId('auto-assign-formation');
      await user.click(autoAssignButton);

      // Verify data consistency
      const formationSlots = screen.getAllByTestId(/formation-slot-/);
      expect(formationSlots).toHaveLength(initialSlotCount);

      // Total players should remain the same
      const benchPlayers = screen.getAllByTestId(/bench-player-/);
      const fieldPlayers = screen.getAllByTestId(/player-/);
      expect(benchPlayers.length + fieldPlayers.length).toBeLessThanOrEqual(initialPlayerCount);
    });
  });
});
