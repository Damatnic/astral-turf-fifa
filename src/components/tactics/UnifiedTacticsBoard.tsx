import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  lazy,
  Suspense,
  startTransition,
  useDeferredValue,
  useReducer,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticsContext, useUIContext, useResponsive } from '../../hooks';
import { useFormationHistory, createHistorySnapshot, type HistoryState } from '../../hooks/useFormationHistory';
import {
  useTheme,
  useAccessibility,
  useMotionSafe,
} from '../../context/ThemeContext';
import { useMobileCapabilities, useMobileViewport } from '../../utils/mobileOptimizations';
import { useOfflineStorage, STORES } from '../../services/offlineStorageManager';
import { ModernField } from './ModernField';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { PlayerDragLayer } from './PlayerDragLayer';
import { ConflictResolutionMenu } from './ConflictResolutionMenu';
import { ExpandedPlayerCard } from './ExpandedPlayerCard';
import ChemistryVisualization from './ChemistryVisualization';
import UnifiedFloatingToolbar from './UnifiedFloatingToolbar';
import DrawingCanvas from './DrawingCanvas';
import AITacticalIntelligence from './AITacticalIntelligence';
import { HistoryTimeline } from './HistoryTimeline';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import QuickStartTemplates from './QuickStartTemplates';
import type { DrawingShape, DrawingTool, Player, Formation, Team, PlayerAttributes } from '../../types';
import { type TacticalPreset } from '../../types/presets';
import { initializeSampleData } from '../../utils/sampleTacticsData';
import { uiReducer, getInitialUIState } from '../../reducers/tacticsBoardUIReducer';

// Mobile optimization components (lazy-loaded for code splitting)
const MobileTacticsBoardContainer = lazy(() =>
  import('./mobile/MobileTacticsBoardContainer').then(m => ({
    default: m.MobileTacticsBoardContainer,
  })),
);

const TouchGestureController = lazy(() =>
  import('./mobile/TouchGestureController').then(m => ({
    default: m.TouchGestureController,
  })),
);

// Performance optimizations
import {
  useFastMemo,
  useThrottleCallback,
  PerformanceMonitor,
  useBatteryAwarePerformance,
} from '../../utils/performanceOptimizations';
import { useCachedQuery } from '../../utils/cachingOptimizations';
import { useIntersectionObserver } from '../../utils/virtualizationOptimizations';
import { FormationWebWorker } from '../../workers/formationCalculationWorker';

/* eslint-disable no-undef */
// Global browser APIs and types that ESLint doesn't recognize

// Lazy load heavy components with standard React lazy loading
const AnimationTimeline = lazy(() => import('./AnimationTimeline'));
const PresentationControls = lazy(() => import('./PresentationControls'));
const DugoutManagement = lazy(() => import('./DugoutManagement'));
const ChallengeManagement = lazy(() => import('./ChallengeManagement'));
const CollaborationFeatures = lazy(() => import('./CollaborationFeatures'));
const EnhancedExportImport = lazy(() => import('./EnhancedExportImport'));
import { Brain } from 'lucide-react';

// Standard React lazy loading
const IntelligentAssistant = lazy(() => import('./IntelligentAssistant'));
const FormationTemplates = lazy(() => import('./FormationTemplates'));
const TacticalPlaybook = lazy(() => import('./TacticalPlaybook'));
const AdvancedAnalyticsDashboard = lazy(() => import('../analytics/AdvancedAnalyticsDashboard'));

interface UnifiedTacticsBoardProps {
  className?: string;
  onSimulateMatch?: (formation: Formation) => void;
  onSaveFormation?: (formation: Formation) => void;
  onAnalyticsView?: () => void;
  onExportFormation?: (formation: Formation) => void;
}

const UnifiedTacticsBoard: React.FC<UnifiedTacticsBoardProps> = ({
  className,
  onSimulateMatch: _onSimulateMatch,
  onSaveFormation: _onSaveFormation,
  onAnalyticsView: _onAnalyticsView,
  onExportFormation: _onExportFormation,
}) => {
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { uiState: contextUIState } = useUIContext();
  const { isMobile, isTablet, prefersReducedMotion } = useResponsive();

  // Initialize UI state with useReducer (consolidates 30+ useState hooks)
  const [boardUIState, uiDispatch] = useReducer(uiReducer, getInitialUIState(isMobile));

  // Mobile zoom and pan state
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobilePanOffset, setMobilePanOffset] = useState({ x: 0, y: 0 });

  // Offline storage for mobile
  const { isOnline, save: saveOffline, syncPendingData } = useOfflineStorage();

  // Core data access - must be declared before useDeferredValue usage
  const activeFormationId = tacticsState?.activeFormationIds?.home;
  const currentFormation = useCachedQuery(
    () => (activeFormationId ? tacticsState?.formations?.[activeFormationId] : undefined),
    [activeFormationId, tacticsState?.formations],
    `formation-${activeFormationId}`,
  );

  // Virtualized players access for large datasets
  const currentPlayers = useCachedQuery(
    () => tacticsState?.players || [],
    [tacticsState?.players],
    'current-players',
  );
  // Mobile optimizations (inline implementation to avoid hook issues)
  const mobileOptimizations = useMemo(
    () => ({
      shouldReduceAnimations: isMobile || prefersReducedMotion,
      reducedEffects: isMobile,
      animationDuration: isMobile ? 150 : 300,
      minTouchTarget: 44,
      enableVirtualization: isMobile,
      enableLazyLoading: true,
    }),
    [isMobile, prefersReducedMotion],
  );
  const mobileCapabilities = useMobileCapabilities();
  const mobileViewport = useMobileViewport();

  // PWA Installation Support - Currently unused but available for future features
  // Commented out to avoid unused variable warnings
  // const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install PWA function - currently unused but available for future PWA install UI
  // Keeping commented out to avoid unused variable warnings
  /*
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
        (window as WindowWithGtag).gtag?.(
          'event',
          outcome === 'accepted' ? 'pwa_install_accepted' : 'pwa_install_dismissed',
          {
            event_category: 'PWA',
            event_label: outcome === 'accepted' ? 'Install Accepted' : 'Install Dismissed',
          },
        );
      }

      setDeferredPrompt(null);
    } catch {
      // Silent error handling
    }
  }, [deferredPrompt]);
  */

  const { isLowPower, getOptimizedConfig } = useBatteryAwarePerformance();

  // Theme and accessibility
  useTheme();
  useAccessibility();
  useMotionSafe();

  // Performance monitoring
  const performanceMonitor = useRef(PerformanceMonitor.getInstance());

  // Track render performance with detailed metrics
  useEffect(() => {
    const endRender = performanceMonitor.current.startRender();
    return endRender;
  });

  // Performance-aware state updates
  const deferredPlayers = useDeferredValue(currentPlayers);
  const deferredFormation = useDeferredValue(currentFormation);

  // Extract UI state for easier access
  const {
    viewMode,
    sidebars,
    panels,
    display,
    interaction,
    conflict,
    expandedCard,
    playerDisplayConfig,
    aiMinimized,
  } = boardUIState;

  // Destructure commonly used values
  const { selectedPlayer, isDragging, isPresenting, positioningMode } = interaction;
  const { showMenu: showConflictMenu, data: conflictData } = conflict;
  const { visible: showExpandedPlayerCard, position: expandedPlayerPosition } = expandedCard;
  const showLeftSidebar = sidebars.left;
  const showRightSidebar = sidebars.right;

  // Sample data initialization
  useEffect(() => {
    // Only initialize sample data if no current data exists
    if (!currentPlayers.length && !currentFormation) {
      const sampleData = initializeSampleData();

      // Dispatch sample players
      tacticsDispatch({
        type: 'SET_PLAYERS',
        payload: sampleData.players,
      });

      // Dispatch sample formation
      tacticsDispatch({
        type: 'SET_FORMATION',
        payload: sampleData.formation,
      });
    }
  }, [currentPlayers.length, currentFormation, tacticsDispatch]);

  // Extract display flags for easier access
  const isGridVisible = display.grid;
  const isFormationStrengthVisible = display.formationStrength;
  const isAIMinimized = aiMinimized;

  // Undo/Redo History System
  const historySystem = useFormationHistory(
    createHistorySnapshot(currentFormation || null, currentPlayers, tacticsState?.drawings || []),
    {
      enableKeyboardShortcuts: true,
      onUndo: (state: HistoryState) => {
        // Restore state from history
        if (state.formation) {
          tacticsDispatch({
            type: 'SET_FORMATION',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload: { id: activeFormationId || 'default', formation: state.formation } as any,
          });
        }
        tacticsDispatch({ type: 'SET_PLAYERS', payload: state.players });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tacticsDispatch({ type: 'UPDATE_STATE', payload: { drawings: state.drawings } } as any);
      },
      onRedo: (state: HistoryState) => {
        // Restore state from history
        if (state.formation) {
          tacticsDispatch({
            type: 'SET_FORMATION',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload: { id: activeFormationId || 'default', formation: state.formation } as any,
          });
        }
        tacticsDispatch({ type: 'SET_PLAYERS', payload: state.players });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tacticsDispatch({ type: 'UPDATE_STATE', payload: { drawings: state.drawings } } as any);
      },
    },
  );

  // Push state to history whenever tactical changes occur
  useEffect(() => {
    if (currentFormation || currentPlayers.length > 0) {
      historySystem.pushState(
        createHistorySnapshot(
          currentFormation || null,
          currentPlayers,
          tacticsState?.drawings || [],
        ),
      );
    }
  }, [currentFormation, currentPlayers, tacticsState?.drawings, historySystem]);

  // Performance optimizations
  const fieldRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const batchedUpdates = useRef<Array<() => void>>([]);

  // Performance-aware configuration with mobile optimizations
  const optimizedConfig = useFastMemo(() => {
    const config = getOptimizedConfig();
    return {
      ...config,
      enableHeavyAnimations:
        !isLowPower && !mobileOptimizations.shouldReduceAnimations && config.enableAnimations,
      enableParticleEffects: !isLowPower && !isMobile && !mobileOptimizations.reducedEffects,
      animationDuration: mobileOptimizations.shouldReduceAnimations
        ? 0
        : mobileOptimizations.animationDuration,
      minTouchTarget: mobileOptimizations.minTouchTarget,
      enableVirtualization: mobileOptimizations.enableVirtualization,
      enableLazyLoading: mobileOptimizations.enableLazyLoading,
    };
  }, [isLowPower, isMobile, mobileOptimizations]);

  // Data access has been moved up to prevent hoisting issues

  // Memoized player counts for optimization decisions
  const playerCount = useFastMemo(
    () => currentPlayers.length,
    [currentPlayers],
    (a, b) => a === b,
  );

  // Enable virtualization for large player sets
  const shouldVirtualize = playerCount > 50;

  // Intersection observer for viewport optimizations
  const [, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Responsive sidebar management with mobile viewport considerations
  useEffect(() => {
    if (isMobile) {
      uiDispatch({ type: 'SET_LEFT_SIDEBAR', payload: false });
      uiDispatch({ type: 'SET_RIGHT_SIDEBAR', payload: false });
    } else if (isTablet) {
      uiDispatch({ type: 'SET_LEFT_SIDEBAR', payload: true });
      uiDispatch({ type: 'SET_RIGHT_SIDEBAR', payload: false });
    } else {
      uiDispatch({ type: 'SET_LEFT_SIDEBAR', payload: true });
      uiDispatch({ type: 'SET_RIGHT_SIDEBAR', payload: true });
    }
  }, [isMobile, isTablet]);

  // Mobile-specific optimizations
  useEffect(() => {
    if (isMobile && mobileCapabilities.hasHapticFeedback) {
      // Enable haptic feedback for mobile interactions
      document.addEventListener(
        'touchstart',
        () => {
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        },
        { passive: true },
      );
    }
  }, [isMobile, mobileCapabilities.hasHapticFeedback]);

  // Offline sync on reconnect
  useEffect(() => {
    if (isOnline && isMobile) {
      syncPendingData();
    }
  }, [isOnline, isMobile, syncPendingData]);

  // Save formation to offline storage on change (mobile only)
  useEffect(() => {
    if (isMobile && tacticsState?.activeFormationIds?.home && tacticsState?.formations) {
      const activeFormationId = tacticsState.activeFormationIds.home;
      const activeFormation = tacticsState.formations[activeFormationId];

      if (activeFormation) {
        const formationId = activeFormation.id || `formation-${Date.now()}`;
        saveOffline(STORES.FORMATIONS, formationId, activeFormation, isOnline).catch(
          error => {
            // eslint-disable-next-line no-console
            console.error('Failed to save formation offline:', error);
          },
        );
      }
    }
  }, [isMobile, tacticsState?.activeFormationIds?.home, tacticsState?.formations, saveOffline, isOnline]);

  // Ultra-optimized player movement with intelligent batching and Web Workers
  const formationWorker = useRef<FormationWebWorker | null>(null);

  useEffect(() => {
    formationWorker.current = new FormationWebWorker();
    return () => formationWorker.current?.terminate();
  }, []);

  const handlePlayerMove = useThrottleCallback(
    async (playerId: string, position: { x: number; y: number }, targetPlayerId?: string) => {
      // If there's a targetPlayerId, instantly swap without confirmation
      if (targetPlayerId && targetPlayerId !== playerId) {
        tacticsDispatch({
          type: 'SWAP_PLAYERS',
          payload: {
            sourcePlayerId: playerId,
            targetPlayerId: targetPlayerId,
          },
        });
        return;
      }

      // Immediate visual feedback for sub-16ms response
      startTransition(() => {
        batchedUpdates.current.push(() => {
          tacticsDispatch({
            type: 'UPDATE_PLAYER_POSITION_OPTIMISTIC',
            payload: { playerId, position },
          });
        });
      });

      // Heavy calculations in Web Worker
      if (shouldVirtualize && formationWorker.current && currentFormation) {
        try {
          const validationResult = await formationWorker.current.validatePlayerPosition({
            playerId,
            position,
            formation: currentFormation,
            players: currentPlayers,
          });

          if (validationResult.isValid) {
            startTransition(() => {
              tacticsDispatch({
                type: 'UPDATE_PLAYER_POSITION',
                payload: { playerId, position: validationResult.optimizedPosition || position },
              });
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Worker validation failed, falling back to sync:', error);
          // Fallback to synchronous update
          tacticsDispatch({
            type: 'UPDATE_PLAYER_POSITION',
            payload: { playerId, position },
          });
        }
      } else {
        // Process batched updates for smaller datasets
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const updates = batchedUpdates.current.splice(0);
          startTransition(() => {
            updates.forEach(update => update());
          });
        });
      }
    },
    8,
  ); // Increased to 120fps for ultra-responsive feel

  // Simple formation change handler
  const handleFormationChange = useCallback(
    (formation: Formation) => {
      tacticsDispatch({
        type: 'UPDATE_FORMATION',
        payload: formation,
      });
    },
    [tacticsDispatch],
  );

  // Player selection handler
  const handlePlayerSelect = useCallback((player: Player, position?: { x: number; y: number }) => {
    uiDispatch({ type: 'SELECT_PLAYER', payload: player });

    // Show expanded card for all player selections
    // Use provided position or default to center of player
    const cardPosition = position || { x: 50, y: 50 }; // Default to center if no position
    uiDispatch({ type: 'SHOW_EXPANDED_CARD', payload: cardPosition });
  }, []);

  // Enhanced player move with conflict resolution
  const handlePlayerMoveWithConflict = useThrottleCallback(
    (playerId: string, position: { x: number; y: number }, targetPlayerId?: string) => {
      // If there's a conflict with another player
      if (targetPlayerId && targetPlayerId !== playerId) {
        const sourcePlayer = currentPlayers.find(p => p.id === playerId);
        const targetPlayer = currentPlayers.find(p => p.id === targetPlayerId);

        if (sourcePlayer && targetPlayer) {
          uiDispatch({
            type: 'SHOW_CONFLICT_MENU',
            payload: {
              sourcePlayer,
              targetPlayer,
              position,
            },
          });
          return;
        }
      }

      // No conflict - proceed with normal move
      handlePlayerMove(playerId, position);
    },
    16,
  );

  // Conflict resolution handler
  const handleConflictResolve = useCallback(
    (action: 'swap' | 'replace' | 'cancel' | 'find_alternative') => {
      if (!conflictData) {
        return;
      }

      const { sourcePlayer, targetPlayer, position } = conflictData;

      switch (action) {
        case 'swap':
          // Swap positions
          tacticsDispatch({
            type: 'SWAP_PLAYERS',
            payload: {
              sourcePlayerId: sourcePlayer.id,
              targetPlayerId: targetPlayer.id,
            },
          });
          break;

        case 'replace':
          // Move target to bench and place source
          tacticsDispatch({
            type: 'MOVE_TO_BENCH',
            payload: { playerId: targetPlayer.id },
          });
          handlePlayerMove(sourcePlayer.id, position);
          break;

        case 'find_alternative':
          // This would trigger alternative position finding logic
          break;

        case 'cancel':
        default:
          // Do nothing - return to previous position
          break;
      }

      uiDispatch({ type: 'HIDE_CONFLICT_MENU' });
    },
    [conflictData, tacticsDispatch, handlePlayerMove],
  );

  // Player action handler (from expanded card)
  const handlePlayerAction = useCallback(
    (action: 'swap' | 'bench' | 'instructions' | 'stats') => {
      if (!selectedPlayer) {
        return;
      }

      switch (action) {
        case 'swap':
          // Enter swap mode - set flag and enable swap cursor
          uiDispatch({ type: 'SET_SWAP_MODE', payload: { playerId: selectedPlayer.id, enabled: true } });
          break;

        case 'bench':
          tacticsDispatch({
            type: 'MOVE_TO_BENCH',
            payload: { playerId: selectedPlayer.id },
          });
          break;

        case 'instructions':
          // Open tactical instructions panel
          uiDispatch({ type: 'OPEN_PANEL', payload: 'playerInstructions' });
          break;

        case 'stats':
          // Open detailed stats view
          uiDispatch({ type: 'SET_DISPLAY', payload: { key: 'playerStats', value: true } });
          break;
      }

      uiDispatch({ type: 'HIDE_EXPANDED_CARD' });
    },
    [selectedPlayer, tacticsDispatch],
  );

  // Drawing state from UI context
  const { drawingTool, drawingColor } = contextUIState;

  // Drawing handlers
  const handleToolChange = useCallback(
    (tool?: DrawingTool) => {
      if (tool) {
        tacticsDispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
      }
    },
    [tacticsDispatch],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      tacticsDispatch({ type: 'SET_DRAWING_COLOR', payload: color });
    },
    [tacticsDispatch],
  );

  const handleAddDrawing = useCallback(
    (shape: DrawingShape) => {
      tacticsDispatch({ type: 'ADD_DRAWING', payload: shape });
    },
    [tacticsDispatch],
  );

  const handleUndoDrawing = useCallback(() => {
    tacticsDispatch({ type: 'UNDO_LAST_DRAWING' });
  }, [tacticsDispatch]);

  const handleClearDrawings = useCallback(() => {
    if (confirm('Are you sure you want to clear all drawings?')) {
      tacticsDispatch({ type: 'CLEAR_DRAWINGS' });
    }
  }, [tacticsDispatch]);

  const handleGridToggle = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_DISPLAY', payload: 'grid' });
  }, []);

  const handleFormationStrengthToggle = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_DISPLAY', payload: 'formationStrength' });
  }, []);

  // Sidebar toggle functions
  const toggleLeftSidebar = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_LEFT_SIDEBAR' });
  }, []);

  const toggleRightSidebar = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' });
  }, []);

  // Dugout management handlers
  const handleSubstitution = useCallback((_playerOut: string, _playerIn: string) => {
    // Handle substitution logic here
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleTacticalChange = useCallback((_adjustment: unknown) => {
    // Handle tactical adjustment
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handlePlayerInstruction = useCallback((_playerId: string, _instruction: string) => {
    // Handle individual player instruction
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Challenge management handlers
  const handleChallengeStart = useCallback((_challengeId: string) => {
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleChallengeComplete = useCallback((_challengeId: string, _score: number) => {
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Collaboration handlers
  const handleShareSession = useCallback((visibility: 'public' | 'private' | 'team') => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Sharing session with visibility: ${visibility}`);
    }
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleInviteCollaborator = useCallback((email: string, role: 'editor' | 'viewer') => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Inviting ${email} as ${role}`);
    }
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleAddComment = useCallback((position: { x: number; y: number }, content: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Adding comment at ${position.x}, ${position.y}: ${content}`);
    }
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleResolveComment = useCallback((commentId: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`Resolving comment: ${commentId}`);
    }
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleUpdatePermissions = useCallback((_collaboratorId: string, _permissions: unknown) => {
    // Future: Update collaborator permissions
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Export/Import handlers
  const handleExportData = useCallback((_options: unknown, _data: unknown) => {
    // Future: Export tactics data
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleImportData = useCallback((_data: unknown, _options: unknown) => {
    // Future: Import tactics data
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleSaveToLibrary = useCallback((_library: unknown) => {
    // Future: Save to tactics library
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleLoadFromLibrary = useCallback((_libraryId: string) => {
    // Future: Load from tactics library
    // You could dispatch to tactics context or call a prop function
  }, []);

  // AI Intelligence handlers
  const handlePlayerAssignmentSuggestion = useCallback(
    (assignments: unknown) => {
      // eslint-disable-next-line no-console
      console.log('Applying AI player assignments:', assignments);
      // Apply optimized assignments to formation
      (assignments as { assignments: Array<{ slotId: string; playerId: string }> }).assignments.forEach((assignment) => {
        tacticsDispatch({
          type: 'ASSIGN_PLAYER_TO_SLOT',
          payload: {
            slotId: assignment.slotId,
            playerId: assignment.playerId,
            team: 'home', // Adjust based on current team context
          },
        });
      });
    },
    [tacticsDispatch],
  );

  const handleTacticalSuggestion = useCallback(
    (suggestion: string) => {
      // eslint-disable-next-line no-console
      console.log('AI Tactical Suggestion:', suggestion);
      // Could show notification or update UI with suggestion
      tacticsDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `AI Suggestion: ${suggestion}`,
          type: 'info',
          duration: 5000,
        },
      });
    },
    [tacticsDispatch],
  );

  const handleDrawingSuggestion = useCallback(
    (suggestion: unknown) => {
      // eslint-disable-next-line no-console
      console.log('AI Drawing Suggestion:', suggestion);
      // Could automatically add suggested drawing or show as suggestion
      const drawingShape = {
        id: Date.now().toString(),
        tool: (suggestion as { tool: string }).tool,
        color: '#3b82f6',
        points: (suggestion as { suggestedPositions?: unknown[] }).suggestedPositions || [],
        timestamp: Date.now(),
      };

      tacticsDispatch({
        type: 'ADD_DRAWING',
        payload: drawingShape as DrawingShape,
      });
    },
    [tacticsDispatch],
  );

  // View mode handlers
  const enterFullscreen = useCallback(() => {
    uiDispatch({ type: 'ENTER_FULLSCREEN' });
    if (fieldRef.current?.requestFullscreen) {
      fieldRef.current.requestFullscreen();
    }
  }, []);

  // Presentation mode handlers
  const togglePresentationMode = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_PRESENTATION_MODE' });
    if (!isPresenting) {
      tacticsDispatch({ type: 'ENTER_PRESENTATION_MODE' });
    } else {
      tacticsDispatch({ type: 'EXIT_PRESENTATION_MODE' });
    }
  }, [isPresenting, tacticsDispatch]);

  const exitFullscreen = useCallback(() => {
    uiDispatch({ type: 'EXIT_FULLSCREEN' });
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  // Apply preset formation handler
  const handleApplyPreset = useCallback(
    (preset: TacticalPreset) => {
      // eslint-disable-next-line no-console
      console.log('Applying preset:', preset);

      // Convert preset positions to actual player assignments
      const newPlayers: Player[] = preset.players.map((presetPlayer, index) => {
        // Find existing player to assign or create placeholder
        const existingPlayer = currentPlayers.find(
          p => !currentFormation?.slots.some(s => s.playerId === p.id),
        );

        if (existingPlayer) {
          // Use existing unassigned player
          return {
            ...existingPlayer,
            position: presetPlayer.position,
            roleId: presetPlayer.role || existingPlayer.roleId,
          };
        }

        // Create new placeholder player with proper type casting
        const playerNumber = index + 1;
        const attributes: PlayerAttributes = {
          speed: presetPlayer.attributes?.speed ?? 70,
          passing: presetPlayer.attributes?.passing ?? 72,
          tackling: presetPlayer.attributes?.tackling ?? 68,
          shooting: presetPlayer.attributes?.shooting ?? 65,
          dribbling: presetPlayer.attributes?.dribbling ?? 70,
          positioning: presetPlayer.attributes?.positioning ?? 72,
          stamina: presetPlayer.attributes?.stamina ?? 85,
        };

        return {
          id: `preset-player-${preset.metadata.id}-${index}`,
          name: `Player ${playerNumber}`,
          jerseyNumber: playerNumber,
          age: 25,
          nationality: 'Astralian',
          potential: [70, 85] as [number, number],
          currentPotential: 78,
          roleId: presetPlayer.role || 'midfielder',
          instructions: presetPlayer.instructions?.reduce((acc, inst) => ({ ...acc, [inst]: true }), {}) || {},
          team: 'home' as Team,
          teamColor: '#1f2937',
          attributes,
          position: presetPlayer.position,
          availability: { status: 'Available' as const },
          morale: 'Good' as const,
          form: 'Good' as const,
          stamina: 85,
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
          fatigue: 10,
          injuryRisk: 12,
          lastConversationInitiatedWeek: 0,
          moraleBoost: null,
          completedChallenges: [],
        };
      });

      // Create formation structure from preset
      const newFormation: Formation = {
        id: `formation-${preset.metadata.id}-${Date.now()}`,
        name: preset.metadata.name,
        slots: preset.players.map((presetPlayer, index) => ({
          id: `slot-${index}`,
          role: presetPlayer.role || 'midfielder',
          defaultPosition: presetPlayer.position,
          position: presetPlayer.position,
          playerId: newPlayers[index].id,
          roleId: presetPlayer.role,
          preferredRoles: [presetPlayer.role || 'midfielder'],
        })),
        isCustom: false,
        notes: preset.metadata.description || '',
      };

      // Validate formation before applying
      const validation = validateFormation(newFormation, newPlayers);
      if (!validation.isValid) {
        tacticsDispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: `Formation validation failed: ${validation.errors.join(', ')}`,
            type: 'error',
            duration: 5000,
          },
        });
        return;
      }

      // Apply tactical instructions if provided
      if (preset.tacticalInstructions) {
        const tacticalSettings = {
          mentality: mapTacticalValue(preset.tacticalInstructions.tempo),
          pressing: mapTacticalValue(preset.tacticalInstructions.pressingIntensity),
          defensiveLine: preset.tacticalInstructions.defensiveLine || 'medium',
          attackingWidth: preset.tacticalInstructions.width || 'standard',
        };

        tacticsDispatch({
          type: 'SET_TEAM_TACTIC',
          payload: {
            team: 'home',
            tactic: 'mentality',
            value: tacticalSettings.mentality,
          },
        });
      }

      // Update players and formation
      tacticsDispatch({
        type: 'SET_PLAYERS',
        payload: newPlayers,
      });

      tacticsDispatch({
        type: 'SET_FORMATION',
        payload: newFormation,
      });

      // Save to history
      historySystem.pushState(
        createHistorySnapshot(newFormation, newPlayers, tacticsState?.drawings || []),
      );

      // Show success notification
      tacticsDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Applied ${preset.metadata.name} formation with ${newPlayers.length} players`,
          type: 'success',
          duration: 3000,
        },
      });

      // Close the panel
      uiDispatch({ type: 'CLOSE_PANEL', payload: 'quickStart' });
    },
    [currentPlayers, currentFormation, tacticsDispatch, historySystem, tacticsState?.drawings],
  );

  // Helper function to map tactical instruction values
  const mapTacticalValue = (value?: string): string => {
    const mapping: Record<string, string> = {
      slow: 'defensive',
      medium: 'balanced',
      fast: 'attacking',
      low: 'defensive',
      high: 'attacking',
    };
    return mapping[value || 'medium'] || 'balanced';
  };

  // Formation validation function
  const validateFormation = (
    formation: Formation,
    _players: Player[],
  ): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum players (must have at least 1 GK and 10 outfield players)
    const playerCount = formation.slots.filter(s => s.playerId).length;
    if (playerCount < 11) {
      errors.push(`Formation requires 11 players, currently has ${playerCount}`);
    }

    // Check for goalkeeper
    const hasGoalkeeper = formation.slots.some(
      s => s.role === 'GK' || s.roleId === 'goalkeeper',
    );
    if (!hasGoalkeeper) {
      errors.push('Formation must include a goalkeeper');
    }

    // Check for duplicate player assignments
    const assignedPlayerIds = formation.slots
      .map(s => s.playerId)
      .filter(Boolean) as string[];
    const uniquePlayerIds = new Set(assignedPlayerIds);
    if (assignedPlayerIds.length !== uniquePlayerIds.size) {
      errors.push('Players cannot be assigned to multiple positions');
    }

    // Check position validity (players should be within field bounds)
    formation.slots.forEach((slot, index) => {
      const pos = slot.position || slot.defaultPosition;
      if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
        errors.push(`Position ${index + 1} is outside field bounds`);
      }
    });

    // Warnings for formation quality
    const defenderCount = formation.slots.filter(
      s => s.role === 'DF' || s.roleId?.includes('back'),
    ).length;
    if (defenderCount < 3) {
      warnings.push('Formation has fewer than 3 defenders - may be vulnerable defensively');
    }

    const midfielderCount = formation.slots.filter(
      s => s.role === 'MF' || s.roleId?.includes('midfield'),
    ).length;
    if (midfielderCount < 2) {
      warnings.push('Formation has fewer than 2 midfielders - may struggle with possession');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  // Quick action handlers - currently unused but available for future quick access UI
  // Commented out to avoid unused variable warnings
  /*
  const quickActions = useMemo(
    () => [
      {
        id: 'formations',
        icon: Users,
        label: 'Formations',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'formationTemplates' }),
        isActive: panels.formationTemplates,
      },
      {
        id: 'quick-start',
        icon: Sparkles,
        label: 'Quick Start Templates',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'quickStart' }),
        isActive: panels.quickStart,
      },
      {
        id: 'simulate',
        icon: Play,
        label: 'Simulate Match',
        action: () => {
          if (currentFormation && onSimulateMatch) {
            onSimulateMatch(currentFormation);
          }
        },
        disabled: !currentFormation || !onSimulateMatch,
      },
      {
        id: 'ai-analysis',
        icon: Brain,
        label: 'AI Analysis',
        action: () => uiDispatch({ type: 'TOGGLE_PANEL', payload: 'aiAnalysis' }),
        isActive: panels.aiAnalysis,
      },
      {
        id: 'ai-intelligence',
        icon: Zap,
        label: 'AI Intelligence',
        action: () => uiDispatch({ type: 'TOGGLE_PANEL', payload: 'aiIntelligence' }),
        isActive: panels.aiIntelligence,
      },
      {
        id: 'analytics',
        icon: BarChart3,
        label: 'Analytics',
        action: () => {
          if (onAnalyticsView) {
            onAnalyticsView();
          }
        },
        disabled: !onAnalyticsView,
      },
      {
        id: 'playbook',
        icon: Save,
        label: 'Tactical Playbook',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'tacticalPlaybook' }),
        isActive: panels.tacticalPlaybook,
      },
      {
        id: 'export',
        icon: Share2,
        label: 'Export & Share',
        action: () => {
          if (currentFormation && onExportFormation) {
            onExportFormation(currentFormation);
          }
        },
        disabled: !currentFormation || !onExportFormation,
      },
      {
        id: 'ai-assistant',
        icon: Brain,
        label: 'AI Assistant',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'aiAssistant' }),
        isActive: panels.aiAssistant,
      },
      {
        id: 'heatmap',
        icon: Activity,
        label: 'Heat Map',
        action: () => uiDispatch({ type: 'TOGGLE_DISPLAY', payload: 'heatMap' }),
        isActive: display.heatMap,
      },
      {
        id: 'chemistry',
        icon: Heart,
        label: 'Player Chemistry',
        action: () => uiDispatch({ type: 'TOGGLE_DISPLAY', payload: 'chemistry' }),
        isActive: display.chemistry,
      },
      {
        id: 'player-stats',
        icon: Eye,
        label: 'Player Stats',
        action: () => uiDispatch({ type: 'TOGGLE_DISPLAY', payload: 'playerStats' }),
        isActive: display.playerStats,
      },
      {
        id: 'analysis',
        icon: Zap,
        label: 'Live Analysis',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'analytics' }),
        isActive: panels.analytics,
      },
      {
        id: 'dugout',
        icon: Users2,
        label: 'Dugout Management',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'dugout' }),
        isActive: panels.dugout,
      },
      {
        id: 'challenges',
        icon: Trophy,
        label: 'Challenge Center',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'challenges' }),
        isActive: panels.challenges,
      },
      {
        id: 'collaboration',
        icon: Users,
        label: 'Collaborate',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'collaboration' }),
        isActive: panels.collaboration,
      },
      {
        id: 'export-import',
        icon: Archive,
        label: 'Export & Import',
        action: () => uiDispatch({ type: 'OPEN_PANEL', payload: 'exportImport' }),
        isActive: panels.exportImport,
      },
      {
        id: 'keyboard-shortcuts',
        icon: Keyboard,
        label: 'Keyboard Shortcuts',
        action: () => uiDispatch({ type: 'TOGGLE_PANEL', payload: 'keyboardShortcuts' }),
        isActive: panels.keyboardShortcuts,
      },
      {
        id: 'history',
        icon: History,
        label: 'Undo/Redo History',
        action: () => uiDispatch({ type: 'TOGGLE_PANEL', payload: 'history' }),
        isActive: panels.history,
      },
      {
        id: 'fullscreen',
        icon: viewMode === 'fullscreen' ? Minimize2 : Maximize2,
        label: viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen',
        action: viewMode === 'fullscreen' ? exitFullscreen : enterFullscreen,
      },
    ],
    [
      panels,
      display,
      viewMode,
      currentFormation,
      onSimulateMatch,
      onAnalyticsView,
      onExportFormation,
      enterFullscreen,
      exitFullscreen,
      uiDispatch,
    ],
  );
  */

  // Additional toolbar actions configuration  // Layout calculations
  const layoutClasses = useMemo(() => {
    return {
      container: viewMode === 'fullscreen' ? 'fixed inset-0 z-50' : 'h-full',
      leftSidebar: 'w-80 flex-shrink-0',
      rightSidebar: 'w-80 flex-shrink-0',
      mainArea: 'flex-1 min-w-0',
    };
  }, [viewMode]);

  // Mobile gesture handlers
  const handlePinchZoom = useCallback(
    (scale: number) => {
      setMobileZoom(prev => Math.max(0.5, Math.min(3, prev * scale)));
    },
    [],
  );

  const handlePan = useCallback((delta: { x: number; y: number }) => {
    setMobilePanOffset(prev => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  }, []);

  const handleDoubleTap = useCallback(() => {
    setMobileZoom(1);
    setMobilePanOffset({ x: 0, y: 0 });
  }, []);

  const handleResetView = useCallback(() => {
    setMobileZoom(1);
    setMobilePanOffset({ x: 0, y: 0 });
  }, []);

  // Main board content
  const boardContent = (
    <div
      ref={fieldRef}
      className={`
        ${layoutClasses.container} 
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
        overflow-hidden
        ${className}
      `}
      style={{
        // Mobile viewport optimizations
        ...(isMobile && {
          paddingTop: mobileViewport.safeAreaTop,
          paddingBottom: mobileViewport.safeAreaBottom,
          paddingLeft: mobileViewport.safeAreaLeft,
          paddingRight: mobileViewport.safeAreaRight,
          minHeight: '-webkit-fill-available', // iOS Safari support
          touchAction: 'manipulation', // Prevent zoom on double-tap
          transform: `scale(${mobileZoom}) translate(${mobilePanOffset.x}px, ${mobilePanOffset.y}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.2s ease-out',
        }),
      }}
      role="application"
      aria-label="Soccer Tactics Board"
      aria-live="polite"
      tabIndex={-1}
    >
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-900/50 to-slate-950"
        aria-hidden="true"
      />

      <div className="relative z-10 h-full flex">
        {/* Left Sidebar */}
        <AnimatePresence mode="wait">
          {showLeftSidebar && (
            <motion.div
              key="left-sidebar"
              initial={optimizedConfig.enableAnimations ? { x: -320, opacity: 0 } : false}
              animate={
                optimizedConfig.enableAnimations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }
              }
              exit={optimizedConfig.enableAnimations ? { x: -320, opacity: 0 } : { opacity: 0 }}
              transition={
                optimizedConfig.enableAnimations
                  ? {
                      duration: optimizedConfig.animationDuration / 1000,
                      ease: 'easeOut',
                    }
                  : { duration: 0 }
              }
              className={layoutClasses.leftSidebar}
              aria-label="Left sidebar"
              role="complementary"
            >
              <LeftSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tactics Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Field Container */}
          <main
            className="flex-1 relative overflow-hidden"
            role="main"
            aria-label="Tactical field workspace"
          >
            <ModernField
              formation={shouldVirtualize ? deferredFormation : currentFormation}
              selectedPlayer={selectedPlayer}
              onPlayerMove={
                positioningMode === 'snap' ? handlePlayerMove : handlePlayerMoveWithConflict
              }
              onPlayerSelect={handlePlayerSelect}
              isDragging={isDragging}
              setIsDragging={dragging => uiDispatch({ type: 'SET_DRAGGING', payload: dragging })}
              viewMode={viewMode}
              players={shouldVirtualize ? deferredPlayers : currentPlayers}
              showHeatMap={
                display.heatMap && optimizedConfig.enableParticleEffects && isIntersecting
              }
              showPlayerStats={display.playerStats && isIntersecting}
              performanceMode={isLowPower || !isIntersecting}
              positioningMode={positioningMode}
            />

            {/* Drawing Canvas Overlay */}
            <DrawingCanvas
              fieldRef={fieldRef}
              drawingTool={drawingTool || 'select'}
              drawingColor={drawingColor || '#3b82f6'}
              drawings={tacticsState?.drawings || []}
              onAddDrawing={handleAddDrawing}
              disabled={isDragging}
              className="z-10"
            />

            {/* Chemistry Visualization */}
            <ChemistryVisualization
              players={currentPlayers}
              showChemistry={display.chemistry}
              viewMode={viewMode}
            />

            {/* Player Drag Layer */}
            <PlayerDragLayer isDragging={isDragging} currentPlayer={selectedPlayer} />

            {/* Conflict Resolution Menu */}
            {showConflictMenu && conflictData && (
              <ConflictResolutionMenu
                isVisible={showConflictMenu}
                position={conflictData.position}
                sourcePlayer={conflictData.sourcePlayer}
                targetPlayer={conflictData.targetPlayer}
                onResolve={handleConflictResolve}
                onClose={() => uiDispatch({ type: 'HIDE_CONFLICT_MENU' })}
              />
            )}

            {/* Expanded Player Card */}
            {showExpandedPlayerCard && selectedPlayer && (
              <ExpandedPlayerCard
                player={selectedPlayer}
                isVisible={showExpandedPlayerCard}
                position={expandedPlayerPosition}
                onClose={() => uiDispatch({ type: 'HIDE_EXPANDED_CARD' })}
                onPlayerAction={handlePlayerAction}
              />
            )}

            {/* Animation Timeline */}
            {contextUIState.activePlaybookItemId && contextUIState.activeStepIndex !== null && (
              <AnimationTimeline />
            )}
          </main>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence mode="wait">
          {showRightSidebar && (
            <motion.div
              key="right-sidebar"
              initial={optimizedConfig.enableAnimations ? { x: 320, opacity: 0 } : false}
              animate={
                optimizedConfig.enableAnimations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }
              }
              exit={optimizedConfig.enableAnimations ? { x: 320, opacity: 0 } : { opacity: 0 }}
              transition={
                optimizedConfig.enableAnimations
                  ? {
                      duration: optimizedConfig.animationDuration / 1000,
                      ease: 'easeOut',
                    }
                  : { duration: 0 }
              }
              className={layoutClasses.rightSidebar}
              aria-label="Right sidebar"
              role="complementary"
            >
              <RightSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Overlays */}
      <AnimatePresence>
        {panels.formationTemplates && (
          <Suspense
            key="formation-templates"
            fallback={
              <div
                className="fixed inset-0 z-50 bg-slate-800  flex items-center justify-center"
                aria-live="polite"
                aria-label="Loading formation templates"
              >
                <div className="bg-slate-900 rounded-xl p-8 text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div>Loading Formation Templates...</div>
                </div>
              </div>
            }
          >
            <FormationTemplates
              onSelect={handleFormationChange}
              onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'formationTemplates' })}
            />
          </Suspense>
        )}

        {panels.aiAssistant && (
          <Suspense
            key="ai-assistant"
            fallback={
              <div
                className="fixed inset-0 z-50 bg-slate-800  flex items-center justify-center"
                aria-live="polite"
                aria-label="Loading AI assistant"
              >
                <div className="bg-slate-900 rounded-xl p-8 text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div>Loading AI Assistant...</div>
                </div>
              </div>
            }
          >
            <IntelligentAssistant
              currentFormation={currentFormation}
              selectedPlayer={selectedPlayer}
              onFormationChange={handleFormationChange}
              onPlayerSelect={handlePlayerSelect}
              onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'aiAssistant' })}
              players={currentPlayers}
            />
          </Suspense>
        )}

        {panels.tacticalPlaybook && (
          <Suspense
            key="tactical-playbook"
            fallback={
              <div
                className="fixed inset-0 z-50 bg-slate-800  flex items-center justify-center"
                aria-live="polite"
                aria-label="Loading tactical playbook"
              >
                <div className="bg-slate-900 rounded-xl p-8 text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div>Loading Tactical Playbook...</div>
                </div>
              </div>
            }
          >
            <TacticalPlaybook
              currentFormation={currentFormation}
              currentPlayers={currentPlayers}
              onLoadFormation={handleFormationChange}
              onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'tacticalPlaybook' })}
              isOpen={panels.tacticalPlaybook}
            />
          </Suspense>
        )}

        {panels.analytics && (
          <Suspense
            key="analytics"
            fallback={
              <div
                className="fixed inset-0 z-50 bg-slate-800  flex items-center justify-center"
                aria-live="polite"
                aria-label="Loading tactical analytics"
              >
                <div className="bg-slate-900 rounded-xl p-8 text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div>Loading Tactical Analytics...</div>
                </div>
              </div>
            }
          >
            <div className="fixed inset-0 z-30 bg-slate-800 ">
              <div className="fixed inset-4 z-31 overflow-auto">
                <AdvancedAnalyticsDashboard
                  players={currentPlayers}
                  onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'analytics' })}
                  className="h-full"
                />
              </div>
            </div>
          </Suspense>
        )}

        {panels.aiAnalysis && (
          <div key="ai-analysis" className="fixed top-20 right-4 z-25 bg-gray-900/95  border border-gray-700 rounded-lg max-w-md">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">AI Tactical Analysis</span>
              </div>
              <button
                onClick={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'aiAnalysis' })}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="text-gray-300 text-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Analyzing formation...</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>• Formation strength: 8.2/10</div>
                  <div>• Defensive stability: High</div>
                  <div>• Attacking potential: Medium</div>
                  <div className="text-yellow-400">
                    • Suggestion: Consider stronger midfield presence
                  </div>
                </div>
                <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors">
                  Get Detailed Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {panels.dugout && (
          <DugoutManagement
            key="dugout"
            players={currentPlayers}
            formation={currentFormation}
            currentMinute={45} // This could come from match state
            substitutionsUsed={1} // This could come from match state
            maxSubstitutions={5}
            onSubstitution={handleSubstitution}
            onTacticalChange={handleTacticalChange}
            onPlayerInstruction={handlePlayerInstruction}
            isOpen={panels.dugout}
            onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'dugout' })}
          />
        )}

        {panels.challenges && (
          <ChallengeManagement
            key="challenges"
            players={currentPlayers}
            formations={tacticsState?.formations || {}}
            completedChallenges={[]} // This would come from state
            onChallengeStart={handleChallengeStart}
            onChallengeComplete={handleChallengeComplete}
            isOpen={panels.challenges}
            onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'challenges' })}
          />
        )}

        {panels.collaboration && (
          <CollaborationFeatures
            key="collaboration"
            formation={currentFormation}
            players={currentPlayers}
            currentUser={{ id: 'user-1', name: 'Head Coach', role: 'coach' }} // This would come from auth state
            onShareSession={handleShareSession}
            onInviteCollaborator={handleInviteCollaborator}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onUpdatePermissions={handleUpdatePermissions}
            isOpen={panels.collaboration}
            onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'collaboration' })}
          />
        )}

        {panels.exportImport && (
          <EnhancedExportImport
            key="export-import"
            formations={tacticsState?.formations || {}}
            playbook={tacticsState?.playbook || {}}
            players={currentPlayers}
            onExport={handleExportData}
            onImport={handleImportData}
            onSaveToLibrary={handleSaveToLibrary}
            onLoadFromLibrary={handleLoadFromLibrary}
            isOpen={panels.exportImport}
            onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'exportImport' })}
          />
        )}

        {/* Quick Start Templates Panel */}
        <QuickStartTemplates
          key="quick-start"
          isOpen={panels.quickStart}
          onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'quickStart' })}
          onApplyPreset={handleApplyPreset}
          currentFormation={currentFormation?.name}
        />

        {/* Keyboard Shortcuts Panel */}
        <KeyboardShortcutsPanel
          key="keyboard-shortcuts"
          isOpen={panels.keyboardShortcuts}
          onClose={() => uiDispatch({ type: 'CLOSE_PANEL', payload: 'keyboardShortcuts' })}
        />

        {/* History Timeline Panel */}
        {panels.history && (
          <div key="history" className="fixed top-20 right-4 z-40 w-96">
            <HistoryTimeline
              timeline={historySystem.timeline}
              currentIndex={historySystem.currentIndex}
              canUndo={historySystem.canUndo}
              canRedo={historySystem.canRedo}
              onUndo={historySystem.undo}
              onRedo={historySystem.redo}
              onJumpToState={historySystem.jumpToState}
              onClearHistory={historySystem.clearHistory}
            />
          </div>
        )}

        {/* AI Tactical Intelligence */}
        {panels.aiIntelligence && (
          <motion.div
            key="ai-intelligence"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-4 z-40 w-96 max-h-[calc(100vh-6rem)]"
          >
            <AITacticalIntelligence
              formation={currentFormation || null}
              players={currentPlayers}
              drawings={tacticsState?.drawings || []}
              team="home"
              isMinimized={isAIMinimized}
              onMinimizeToggle={() => uiDispatch({ type: 'TOGGLE_AI_MINIMIZED' })}
              onPlayerAssignmentSuggestion={handlePlayerAssignmentSuggestion}
              onTacticalSuggestion={handleTacticalSuggestion}
              onDrawingSuggestion={handleDrawingSuggestion}
              className="shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presentation Controls */}
      <PresentationControls
        isPresenting={isPresenting}
        onTogglePresentation={togglePresentationMode}
        onEnterFullscreen={enterFullscreen}
        onExitFullscreen={exitFullscreen}
        isFullscreen={viewMode === 'fullscreen'}
      />

      {/* Screen Reader Only Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedPlayer && `Selected player: ${selectedPlayer.name}`}
        {isDragging && 'Dragging player'}
        {currentFormation && `Current formation: ${currentFormation.name}`}
        {isPresenting && 'Presentation mode active'}
      </div>

      {/* Unified Floating Toolbar - Always visible at top */}
      <UnifiedFloatingToolbar
        selectedPlayer={selectedPlayer}
        currentFormation={currentFormation}
        currentPlayers={currentPlayers}
        onFormationChange={handleFormationChange}
        onNotification={(message, type) => {
          tacticsDispatch({
            type: 'ADD_NOTIFICATION',
            payload: { message, type },
          });
        }}
        showLeftSidebar={showLeftSidebar}
        showRightSidebar={showRightSidebar}
        onToggleLeftSidebar={toggleLeftSidebar}
        onToggleRightSidebar={toggleRightSidebar}
        drawingTool={drawingTool || 'select'}
        drawingColor={drawingColor || '#3b82f6'}
        drawings={tacticsState?.drawings || []}
        onToolChange={handleToolChange}
        onColorChange={handleColorChange}
        onUndoDrawing={handleUndoDrawing}
        onClearDrawings={handleClearDrawings}
        positioningMode={positioningMode}
        isGridVisible={isGridVisible}
        isFormationStrengthVisible={isFormationStrengthVisible}
        onPositioningModeToggle={() => uiDispatch({ type: 'TOGGLE_POSITIONING_MODE' })}
        onGridToggle={handleGridToggle}
        onFormationStrengthToggle={handleFormationStrengthToggle}
        isAnimating={contextUIState.isAnimating || false}
        canPlayAnimation={
          !!(
            contextUIState.activePlaybookItemId &&
            tacticsState?.playbook?.[contextUIState.activePlaybookItemId]?.steps?.length > 1
          )
        }
        onPlayAnimation={() => tacticsDispatch({ type: 'START_ANIMATION' })}
        onResetAnimation={() => tacticsDispatch({ type: 'RESET_ANIMATION' })}
        viewMode={viewMode}
        onToggleFullscreen={viewMode === 'fullscreen' ? exitFullscreen : enterFullscreen}
        playerDisplayConfig={playerDisplayConfig}
        onPlayerDisplayConfigChange={config =>
          uiDispatch({ type: 'UPDATE_PLAYER_DISPLAY_CONFIG', payload: config })
        }
      />
    </div>
  );

  // Return with mobile optimization wrapper if on mobile
  if (isMobile) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="text-white text-lg">Loading mobile controls...</div>
          </div>
        }
      >
        <MobileTacticsBoardContainer
          onZoomChange={setMobileZoom}
          onReset={handleResetView}
          isMobile={true}
        >
          <TouchGestureController
            handlers={{
              onPinch: handlePinchZoom,
              onPan: handlePan,
              onDoubleTap: handleDoubleTap,
              onTap: (_event) => {
                // Tap handling for player selection (if needed)
                // Can be extended to handle field clicks
              },
            }}
            enablePinchZoom={true}
            enablePan={true}
            enableHaptics={mobileCapabilities.hasHapticFeedback}
            minScale={0.5}
            maxScale={3}
          >
            {boardContent}
          </TouchGestureController>
        </MobileTacticsBoardContainer>
      </Suspense>
    );
  }

  return boardContent;
};

export { UnifiedTacticsBoard };
export default React.memo(UnifiedTacticsBoard);
