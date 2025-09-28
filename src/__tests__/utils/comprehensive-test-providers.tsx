import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppProvider';
import { ThemeProvider } from '../../context/ThemeContext';
import { TacticsProvider } from '../../context/TacticsContext';
import { UIProvider } from '../../context/UIContext';
import { AuthProvider } from '../../context/AuthContext';
import { type Player, type Formation, type TacticsState, type UIState } from '../../types';
import { initializeSampleData } from '../../utils/sampleTacticsData';

/**
 * Comprehensive test wrapper providing all necessary contexts for testing
 */
interface TestProvidersProps {
  children: React.ReactNode;
  initialTacticsState?: Partial<TacticsState>;
  initialUIState?: Partial<UIState>;
  initialAuthState?: any;
  router?: boolean;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialTacticsState,
  initialUIState,
  initialAuthState,
  router = true,
}) => {
  const content = (
    <AuthProvider initialState={initialAuthState}>
      <ThemeProvider>
        <TacticsProvider initialState={initialTacticsState}>
          <UIProvider initialState={initialUIState}>
            <AppProvider>
              {children}
            </AppProvider>
          </UIProvider>
        </TacticsProvider>
      </ThemeProvider>
    </AuthProvider>
  );

  if (router) {
    return <BrowserRouter>{content}</BrowserRouter>;
  }

  return content;
};

/**
 * Enhanced render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTacticsState?: Partial<TacticsState>;
  initialUIState?: Partial<UIState>;
  initialAuthState?: any;
  router?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    initialTacticsState,
    initialUIState,
    initialAuthState,
    router = true,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders
      initialTacticsState={initialTacticsState}
      initialUIState={initialUIState}
      initialAuthState={initialAuthState}
      router={router}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create comprehensive test data sets
 */
export const createTestData = {
  /**
   * Complete tactical setup with players and formation
   */
  complete: () => {
    const sampleData = initializeSampleData();
    return {
      players: sampleData.players,
      formation: sampleData.formation,
      tacticsState: {
        players: sampleData.players,
        formations: { [sampleData.formation.id]: sampleData.formation },
        activeFormationIds: { home: sampleData.formation.id },
        drawings: [],
        playbook: {},
        matchState: null,
        notifications: []
      } as TacticsState,
      uiState: {
        isLoading: false,
        selectedTool: 'select',
        drawingTool: 'select',
        drawingColor: '#3b82f6',
        drawings: [],
        activePlaybookItemId: null,
        activeStepIndex: null,
        isAnimating: false,
        collaborationMode: false,
        presentationMode: false
      } as UIState
    };
  },

  /**
   * Minimal data for basic tests
   */
  minimal: () => {
    const player: Player = {
      id: 'test-player-1',
      name: 'Test Player',
      position: 'midfielder',
      jerseyNumber: 10,
      skills: {
        pace: 80,
        shooting: 75,
        passing: 85,
        defending: 70,
        dribbling: 80,
        physical: 75
      },
      currentPosition: { x: 50, y: 50 },
      isSelected: false,
      stamina: 100,
      morale: 80,
      isAvailable: true
    };

    const formation: Formation = {
      id: 'test-formation-1',
      name: 'Test Formation',
      type: '4-4-2',
      description: 'Test formation for testing',
      positions: [
        { id: 'pos-1', x: 50, y: 50, role: 'midfielder', playerId: 'test-player-1' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { player, formation, players: [player] };
  },

  /**
   * Large dataset for performance testing
   */
  performance: (playerCount: number = 100) => {
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `perf-player-${i}`,
      name: `Performance Player ${i}`,
      position: ['goalkeeper', 'defender', 'midfielder', 'forward'][i % 4] as Player['position'],
      jerseyNumber: i + 1,
      skills: {
        pace: Math.floor(Math.random() * 40) + 60,
        shooting: Math.floor(Math.random() * 40) + 60,
        passing: Math.floor(Math.random() * 40) + 60,
        defending: Math.floor(Math.random() * 40) + 60,
        dribbling: Math.floor(Math.random() * 40) + 60,
        physical: Math.floor(Math.random() * 40) + 60
      },
      currentPosition: { 
        x: Math.floor(Math.random() * 100), 
        y: Math.floor(Math.random() * 100) 
      },
      isSelected: false,
      stamina: Math.floor(Math.random() * 40) + 60,
      morale: Math.floor(Math.random() * 40) + 60,
      isAvailable: true
    }));

    const formation: Formation = {
      id: 'perf-formation-1',
      name: 'Performance Test Formation',
      type: '4-4-2',
      description: 'Large formation for performance testing',
      positions: players.slice(0, 11).map((player, i) => ({
        id: `perf-pos-${i}`,
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        role: player.position,
        playerId: player.id
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { players, formation };
  }
};

/**
 * Mock functions for common component props
 */
export const createMockProps = {
  unifiedTacticsBoard: () => ({
    onSimulateMatch: vi.fn(),
    onSaveFormation: vi.fn(),
    onAnalyticsView: vi.fn(),
    onExportFormation: vi.fn(),
    className: 'test-tactics-board'
  }),

  playerDisplaySettings: () => ({
    config: {
      showNames: true,
      showNumbers: true,
      showStats: false,
      showStamina: true,
      showMorale: true,
      showAvailability: true,
      iconType: 'circle' as const,
      namePosition: 'below' as const,
      size: 'medium' as const
    },
    onChange: vi.fn(),
    onReset: vi.fn()
  }),

  positionalBench: () => ({
    players: createTestData.complete().players.slice(11),
    onPlayerSelect: vi.fn(),
    onPlayerMove: vi.fn(),
    groupBy: 'position' as const,
    showStats: true,
    className: 'test-bench'
  })
};

/**
 * Performance measurement utilities
 */
export const testUtils = {
  /**
   * Measure component render time
   */
  async measureRenderTime(renderFn: () => void): Promise<number> {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
  },

  /**
   * Wait for all lazy components to load
   */
  async waitForLazyComponents(timeout: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  },

  /**
   * Simulate user interactions
   */
  async simulatePlayerDrag(
    element: HTMLElement,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): Promise<void> {
    const { fireEvent } = await import('@testing-library/react');
    
    fireEvent.mouseDown(element, { clientX: from.x, clientY: from.y });
    fireEvent.dragStart(element);
    fireEvent.dragOver(element, { clientX: to.x, clientY: to.y });
    fireEvent.drop(element, { clientX: to.x, clientY: to.y });
    fireEvent.mouseUp(element, { clientX: to.x, clientY: to.y });
  }
};

/**
 * Canvas mocking utilities
 */
export const mockCanvas = () => {
  const mockContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(() => mockContext),
    writable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: vi.fn(() => 'data:image/png;base64,mock'),
    writable: true,
  });

  return mockContext;
};

/**
 * Export commonly used testing utilities
 */
export { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
export { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Add missing dependencies for jest-axe
 */
export type { JestAxeConfigureOptions } from 'jest-axe';