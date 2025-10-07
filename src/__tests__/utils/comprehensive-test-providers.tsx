import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppProvider';
import { ThemeProvider } from '../../context/ThemeContext';
import { TacticsProvider } from '../../context/TacticsContext';
import { UIProvider } from '../../context/UIContext';
import { AuthProvider } from '../../context/AuthContext';
import {
  type Player,
  type Formation,
  type FormationSlot,
  type TacticsState,
  type UIState,
  type AuthState,
  type PositionRole,
} from '../../types';
import { INITIAL_STATE } from '../../constants';

/**
 * Comprehensive test wrapper providing all necessary contexts for testing
 */
interface TestProvidersProps {
  children: React.ReactNode;
  initialTacticsState?: Partial<TacticsState>;
  initialUIState?: Partial<UIState>;
  initialAuthState?: Partial<AuthState>;
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
            <AppProvider>{children}</AppProvider>
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
  initialAuthState?: Partial<AuthState>;
  router?: boolean;
}

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
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

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createBasePlayer = (overrides: Partial<Player> = {}): Player => {
  const base: Player = {
    id: 'player-1',
    name: 'Test Player',
    jerseyNumber: 10,
    age: 25,
    nationality: 'Testland',
    potential: [80, 92],
    currentPotential: 85,
    roleId: 'central-midfielder',
    instructions: {},
    team: 'home',
    teamColor: '#1f2937',
    attributes: {
      speed: 78,
      passing: 82,
      tackling: 70,
      shooting: 74,
      dribbling: 80,
      positioning: 77,
      stamina: 88,
    },
    position: { x: 50, y: 50 },
    availability: { status: 'Available' },
    morale: 'Good',
    form: 'Good',
    stamina: 88,
    developmentLog: [],
    contract: { clauses: [] },
    stats: {
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      shotsOnTarget: 0,
      tacklesWon: 0,
      saves: 0,
      passesCompleted: 0,
      passesAttempted: 0,
      careerHistory: [],
    },
    loan: { isLoaned: false },
    traits: [],
    individualTrainingFocus: null,
    conversationHistory: [],
    attributeHistory: [],
    attributeDevelopmentProgress: {},
    communicationLog: [],
    customTrainingSchedule: null,
    fatigue: 0,
    injuryRisk: 10,
    lastConversationInitiatedWeek: 0,
    moraleBoost: null,
    completedChallenges: [],
  };

  const player: Player = {
    ...base,
    ...overrides,
  };

  player.attributes = { ...base.attributes, ...(overrides.attributes ?? {}) };
  player.availability = { ...base.availability, ...(overrides.availability ?? {}) };
  player.stats = {
    ...base.stats,
    ...(overrides.stats ?? {}),
    careerHistory: overrides.stats?.careerHistory ?? base.stats.careerHistory,
  };
  player.contract = {
    ...base.contract,
    ...(overrides.contract ?? {}),
    clauses: overrides.contract?.clauses ?? base.contract.clauses,
  };
  player.loan = { ...base.loan, ...(overrides.loan ?? {}) };
  player.traits = overrides.traits ?? base.traits;
  player.developmentLog = overrides.developmentLog ?? base.developmentLog;
  player.conversationHistory = overrides.conversationHistory ?? base.conversationHistory;
  player.attributeHistory = overrides.attributeHistory ?? base.attributeHistory;
  player.attributeDevelopmentProgress =
    overrides.attributeDevelopmentProgress ?? base.attributeDevelopmentProgress;
  player.communicationLog = overrides.communicationLog ?? base.communicationLog;
  player.customTrainingSchedule = overrides.customTrainingSchedule ?? base.customTrainingSchedule;
  player.moraleBoost = overrides.moraleBoost ?? base.moraleBoost;
  player.completedChallenges = overrides.completedChallenges ?? base.completedChallenges;
  player.individualTrainingFocus =
    overrides.individualTrainingFocus ?? base.individualTrainingFocus;

  return player;
};

const createFormationSlot = (
  id: string,
  role: PositionRole,
  defaultPosition: { x: number; y: number },
  playerId: string | null,
  preferredRoles?: string[],
): FormationSlot => ({
  id,
  role,
  defaultPosition,
  playerId,
  ...(preferredRoles && preferredRoles.length ? { preferredRoles } : {}),
});

const buildTacticsState = (players: Player[], formation: Formation): TacticsState => ({
  players,
  formations: { [formation.id]: formation },
  playbook: {},
  activeFormationIds: { home: formation.id, away: formation.id },
  teamTactics: {
    home: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
    away: {
      mentality: 'balanced',
      pressing: 'medium',
      defensiveLine: 'medium',
      attackingWidth: 'medium',
    },
  },
  drawings: [],
  tacticalFamiliarity: { [formation.id]: 70 },
  chemistry: {},
  captainIds: { home: players[0]?.id ?? null, away: null },
  setPieceTakers: { home: {}, away: {} },
});

const buildUIState = (overrides: Partial<UIState> = {}): UIState => {
  const base = deepClone(INITIAL_STATE.ui);

  return {
    ...base,
    ...overrides,
    tutorial: {
      ...base.tutorial,
      ...(overrides.tutorial ?? {}),
    },
    setPieceEditor: {
      ...base.setPieceEditor,
      ...(overrides.setPieceEditor ?? {}),
    },
    teamKits: {
      home: { ...base.teamKits.home, ...(overrides.teamKits?.home ?? {}) },
      away: { ...base.teamKits.away, ...(overrides.teamKits?.away ?? {}) },
    },
    transferMarketFilters: {
      ...base.transferMarketFilters,
      ...(overrides.transferMarketFilters ?? {}),
    },
    advancedRosterFilters: {
      ...base.advancedRosterFilters,
      ...(overrides.advancedRosterFilters ?? {}),
    },
    playbookCategories: {
      ...base.playbookCategories,
      ...(overrides.playbookCategories ?? {}),
    },
    settings: {
      ...base.settings,
      ...(overrides.settings ?? {}),
    },
  };
};

/**
 * Create comprehensive test data sets
 */
export const createTestData = {
  /**
   * Complete tactical setup with players and formation
   */
  complete: () => {
    const slotDefinitions: Array<{
      id: string;
      role: PositionRole;
      position: { x: number; y: number };
      roleId: string;
    }> = [
      { id: 'gk', role: 'GK', position: { x: 50, y: 8 }, roleId: 'goalkeeper' },
      { id: 'lb', role: 'DF', position: { x: 18, y: 28 }, roleId: 'left-back' },
      { id: 'lcb', role: 'DF', position: { x: 35, y: 25 }, roleId: 'centre-back' },
      { id: 'rcb', role: 'DF', position: { x: 65, y: 25 }, roleId: 'centre-back' },
      { id: 'rb', role: 'DF', position: { x: 82, y: 28 }, roleId: 'right-back' },
      { id: 'cdm', role: 'MF', position: { x: 50, y: 45 }, roleId: 'defensive-midfielder' },
      { id: 'lcm', role: 'MF', position: { x: 32, y: 58 }, roleId: 'central-midfielder' },
      { id: 'rcm', role: 'MF', position: { x: 68, y: 58 }, roleId: 'central-midfielder' },
      { id: 'lw', role: 'FW', position: { x: 25, y: 78 }, roleId: 'left-winger' },
      { id: 'st', role: 'FW', position: { x: 50, y: 85 }, roleId: 'striker' },
      { id: 'rw', role: 'FW', position: { x: 75, y: 78 }, roleId: 'right-winger' },
    ];

    const starters = slotDefinitions.map((slot, index) =>
      createBasePlayer({
        id: `starter-${index + 1}`,
        name: `Starter ${index + 1}`,
        jerseyNumber: index + 1,
        roleId: slot.roleId,
        position: slot.position,
        attributes: {
          speed: 70 + (index % 10),
          passing: 72 + (index % 8),
          tackling: 65 + (index % 7),
          shooting: 68 + (index % 9),
          dribbling: 70 + (index % 6),
          positioning: 74 + (index % 5),
          stamina: 80 + (index % 6),
        },
      }),
    );

    const benchRoles: PositionRole[] = ['GK', 'DF', 'MF', 'FW'];
    const bench = benchRoles.map((role, index) =>
      createBasePlayer({
        id: `bench-${index + 1}`,
        name: `Bench Player ${index + 1}`,
        jerseyNumber: 50 + index,
        roleId:
          role === 'GK'
            ? 'goalkeeper'
            : role === 'DF'
              ? 'centre-back'
              : role === 'MF'
                ? 'central-midfielder'
                : 'striker',
        position: { x: 5 + index * 3, y: 5 },
        stamina: 82 - index,
      }),
    );

    const players = [...starters, ...bench];

    const formation: Formation = {
      id: 'test-formation-433',
      name: 'Test Formation 4-3-3',
      slots: slotDefinitions.map((slot, index) =>
        createFormationSlot(slot.id, slot.role, slot.position, starters[index]?.id ?? null),
      ),
    };

    const tacticsState = buildTacticsState(players, formation);
    const uiState = buildUIState({
      activeTeamContext: 'home',
      highlightedByAIPlayerIds: starters.slice(0, 3).map(player => player.id),
    });

    return { players, formation, tacticsState, uiState };
  },

  /**
   * Minimal data for basic tests
   */
  minimal: () => {
    const player = createBasePlayer({
      id: 'minimal-player',
      name: 'Minimal Player',
      roleId: 'central-midfielder',
      position: { x: 50, y: 50 },
    });

    const formation: Formation = {
      id: 'minimal-formation',
      name: 'Minimal Setup',
      slots: [createFormationSlot('mid', 'MF', { x: 50, y: 50 }, player.id)],
    };

    return {
      player,
      players: [player],
      formation,
      tacticsState: buildTacticsState([player], formation),
      uiState: buildUIState(),
    };
  },

  /**
   * Large dataset for performance testing
   */
  performance: (playerCount: number = 100) => {
    const roleCycle: PositionRole[] = ['GK', 'DF', 'MF', 'FW'];

    const players = Array.from({ length: playerCount }, (_, index) => {
      const role = roleCycle[index % roleCycle.length];
      const isGoalkeeper = role === 'GK';

      return createBasePlayer({
        id: `perf-player-${index + 1}`,
        name: `Performance Player ${index + 1}`,
        jerseyNumber: (index % 99) + 1,
        roleId:
          role === 'GK'
            ? 'goalkeeper'
            : role === 'DF'
              ? 'centre-back'
              : role === 'MF'
                ? 'central-midfielder'
                : 'striker',
        team: index % 2 === 0 ? 'home' : 'away',
        teamColor: index % 2 === 0 ? '#1f2937' : '#dc2626',
        position: { x: (index * 7) % 100, y: (index * 11) % 100 },
        stamina: 65 + (index % 35),
        morale: index % 3 === 0 ? 'Excellent' : index % 3 === 1 ? 'Good' : 'Okay',
        form: index % 2 === 0 ? 'Good' : 'Average',
        attributes: {
          speed: 70 + (index % 20),
          passing: 68 + (index % 18),
          tackling: 60 + (index % 15),
          shooting: 65 + (index % 17),
          dribbling: 66 + (index % 16),
          positioning: 64 + (index % 19),
          stamina: 70 + (index % 20),
        },
        stats: {
          goals: isGoalkeeper ? 0 : index % 12,
          assists: isGoalkeeper ? 0 : index % 9,
          matchesPlayed: 30,
          shotsOnTarget: isGoalkeeper ? 0 : 10 + (index % 5),
          tacklesWon: role !== 'FW' ? 15 + (index % 7) : 5,
          saves: isGoalkeeper ? 40 + (index % 20) : 0,
          passesCompleted: 400 + index * 3,
          passesAttempted: 450 + index * 4,
          careerHistory: [],
        },
      });
    });

    const formationSlots: FormationSlot[] = players
      .slice(0, 11)
      .map((player, index) =>
        createFormationSlot(
          `perf-slot-${index + 1}`,
          roleCycle[index % roleCycle.length],
          { x: (index * 9) % 100, y: 15 + (index % 11) * 7 },
          player.id,
        ),
      );

    const formation: Formation = {
      id: 'perf-formation',
      name: 'Performance Test Formation',
      slots: formationSlots,
    };

    return {
      players,
      formation,
      tacticsState: buildTacticsState(players, formation),
    };
  },
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
    className: 'test-tactics-board',
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
      size: 'medium' as const,
    },
    onChange: vi.fn(),
    onConfigChange: vi.fn(),
    onReset: vi.fn(),
  }),

  positionalBench: () => ({
    players: createTestData.complete().players.slice(11),
    onPlayerSelect: vi.fn(),
    onPlayerMove: vi.fn(),
    groupBy: 'position' as const,
    showStats: true,
    className: 'test-bench',
  }),
};

/**
 * Performance measurement utilities
 */
export const testUtils = {
  /**
   * Measure component render time
   */
  async measureRenderTime(renderFn: () => void): Promise<number> {
    const perf = globalThis.performance ?? { now: () => Date.now() };
    const startTime = perf.now();
    renderFn();
    const endTime = perf.now();
    return endTime - startTime;
  },

  /**
   * Wait for all lazy components to load
   */
  async waitForLazyComponents(timeout: number = 5000): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  },

  /**
   * Simulate user interactions
   */
  async simulatePlayerDrag(
    element: HTMLElement,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): Promise<void> {
    const { fireEvent } = await import('@testing-library/react');

    fireEvent.mouseDown(element, { clientX: from.x, clientY: from.y });
    fireEvent.dragStart(element);
    fireEvent.dragOver(element, { clientX: to.x, clientY: to.y });
    fireEvent.drop(element, { clientX: to.x, clientY: to.y });
    fireEvent.mouseUp(element, { clientX: to.x, clientY: to.y });
  },
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
