import React, { useState, useCallback, useRef, useEffect, useMemo, memo, lazy, Suspense, startTransition, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticsContext, useUIContext, useResponsive } from '../../hooks';
import { useTheme, useAccessibility, useMotionSafe, useKeyboardNavigation } from '../../context/ThemeContext';
import { useMobileCapabilities, useMobileViewport } from '../../utils/mobileOptimizations';
import { ModernField } from './ModernField';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { PlayerDragLayer } from './PlayerDragLayer';
import { ConflictResolutionMenu } from './ConflictResolutionMenu';
import { ExpandedPlayerCard } from './ExpandedPlayerCard';
import ChemistryVisualization from './ChemistryVisualization';
import UnifiedFloatingToolbar from './UnifiedFloatingToolbar';
import PlayerDisplaySettings, { PlayerDisplayConfig } from './PlayerDisplaySettings';
import DrawingCanvas from './DrawingCanvas';
import AITacticalIntelligence from './AITacticalIntelligence';
import PositionalBench from './PositionalBench';
import type { DrawingShape, DrawingTool } from '../../types';
import { type Player, type Formation } from '../../types';
import { initializeSampleData, getBenchPlayers } from '../../utils/sampleTacticsData';

// Performance optimizations
import { 
  useFastMemo, 
  useThrottleCallback,
  PerformanceMonitor,
  useBatteryAwarePerformance,
  useVirtualization,
  createWebWorker
} from '../../utils/performanceOptimizations';
import { createOptimizedLazy, withLazyLoading } from '../../utils/lazyLoadingOptimizations';
import { useCachedFormation, formationCache, playerCache, useCachedQuery } from '../../utils/cachingOptimizations';
import { useOptimizedRaf } from '../../utils/animationOptimizations';
import { useVirtualList, useIntersectionObserver } from '../../utils/virtualizationOptimizations';
import { FormationWebWorker } from '../../workers/formationCalculationWorker';

// Lazy load heavy components with optimized loading
const AnimationTimeline = createOptimizedLazy(() => import('./AnimationTimeline'), { preloadStrategy: 'hover' });
const PresentationControls = createOptimizedLazy(() => import('./PresentationControls'), { preloadStrategy: 'instant' });
const DugoutManagement = createOptimizedLazy(() => import('./DugoutManagement'), { preloadStrategy: 'hover' });
const ChallengeManagement = createOptimizedLazy(() => import('./ChallengeManagement'), { preloadStrategy: 'hover' });
const CollaborationFeatures = createOptimizedLazy(() => import('./CollaborationFeatures'), { preloadStrategy: 'hover' });
const EnhancedExportImport = createOptimizedLazy(() => import('./EnhancedExportImport'), { preloadStrategy: 'hover' });
import {
  Users,
  Zap,
  Brain,
  Settings,
  Maximize2,
  Minimize2,
  Play,
  BarChart3,
  Save,
  Share2,
  Activity,
  Eye,
  Users2,
  Trophy,
  Archive,
  Heart,
  Pen,
} from 'lucide-react';

// Ultra-optimized lazy loading with preloading strategies
const IntelligentAssistant = createOptimizedLazy(() => import('./IntelligentAssistant'), { 
  preloadStrategy: 'hover',
  timeout: 8000,
  retryAttempts: 2
});
const FormationTemplates = createOptimizedLazy(() => import('./FormationTemplates'), { 
  preloadStrategy: 'hover',
  timeout: 5000
});
const TacticalPlaybook = createOptimizedLazy(() => import('./TacticalPlaybook'), { 
  preloadStrategy: 'viewport',
  timeout: 8000
});
const AdvancedAnalyticsDashboard = createOptimizedLazy(() => import('../analytics/AdvancedAnalyticsDashboard'), { 
  preloadStrategy: 'hover',
  timeout: 10000,
  retryAttempts: 2
});

interface UnifiedTacticsBoardProps {
  className?: string;
  onSimulateMatch?: (formation: Formation) => void;
  onSaveFormation?: (formation: Formation) => void;
  onAnalyticsView?: () => void;
  onExportFormation?: (formation: Formation) => void;
}

type ViewMode = 'standard' | 'fullscreen' | 'presentation';

const UnifiedTacticsBoard: React.FC<UnifiedTacticsBoardProps> = ({
  className,
  onSimulateMatch,
  onSaveFormation,
  onAnalyticsView,
  onExportFormation,
}) => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { isMobile, isTablet, isTouchDevice, prefersReducedMotion } = useResponsive();
  
  // Core data access - must be declared before useDeferredValue usage
  const activeFormationId = tacticsState?.activeFormationIds?.home;
  const currentFormation = useCachedQuery(
    () => activeFormationId ? tacticsState?.formations?.[activeFormationId] : undefined,
    [activeFormationId, tacticsState?.formations],
    `formation-${activeFormationId}`
  );
  
  // Virtualized players access for large datasets
  const currentPlayers = useCachedQuery(
    () => tacticsState?.players || [],
    [tacticsState?.players],
    'current-players'
  );
  // Mobile optimizations (inline implementation to avoid hook issues)
  const mobileOptimizations = useMemo(() => ({
    shouldReduceAnimations: isMobile || prefersReducedMotion,
    reducedEffects: isMobile,
    animationDuration: isMobile ? 150 : 300,
    minTouchTarget: 44,
    enableVirtualization: isMobile,
    enableLazyLoading: true
  }), [isMobile, prefersReducedMotion]);
  const mobileCapabilities = useMobileCapabilities();
  const mobileViewport = useMobileViewport();
  // PWA placeholder (not implemented yet)
  const isInstallable = false;
  const installApp = () => console.log('PWA installation not implemented');
  const { isLowPower, getOptimizedConfig } = useBatteryAwarePerformance();
  
  // Theme and accessibility
  const { theme, isDark } = useTheme();
  const { reducedMotion, highContrast, shouldAnimate } = useAccessibility();
  const motionSafe = useMotionSafe();
  
  // Performance monitoring
  const performanceMonitor = useRef(PerformanceMonitor.getInstance());
  const renderStartTime = useRef(Date.now());
  const componentMountTime = useRef(Date.now());
  
  // Track render performance with detailed metrics
  useEffect(() => {
    const endRender = performanceMonitor.current.startRender();
    
    // Track component lifecycle metrics
    const mountTime = Date.now() - componentMountTime.current;
    if (mountTime > 100) { // Log slow mounts
      console.warn(`[Performance] Slow component mount: ${mountTime}ms`);
    }
    
    return endRender;
  });
  
  // Performance-aware state updates
  const deferredPlayers = useDeferredValue(currentPlayers);
  const deferredFormation = useDeferredValue(currentFormation);

  // Core UI state
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [showLeftSidebar, setShowLeftSidebar] = useState(!isMobile);
  const [showRightSidebar, setShowRightSidebar] = useState(!isMobile);
  const [showFormationTemplates, setShowFormationTemplates] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTacticalPlaybook, setShowTacticalPlaybook] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showDugoutManagement, setShowDugoutManagement] = useState(false);
  const [showChallengeManagement, setShowChallengeManagement] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [positioningMode, setPositioningMode] = useState<'snap' | 'free'>('snap');
  const [showConflictMenu, setShowConflictMenu] = useState(false);
  const [conflictData, setConflictData] = useState<{
    sourcePlayer: Player;
    targetPlayer: Player;
    position: { x: number; y: number };
  } | null>(null);
  const [showExpandedPlayerCard, setShowExpandedPlayerCard] = useState(false);
  const [expandedPlayerPosition, setExpandedPlayerPosition] = useState({ x: 0, y: 0 });
  const [showChemistry, setShowChemistry] = useState(false);
  
  // Player display configuration state
  const [playerDisplayConfig, setPlayerDisplayConfig] = useState<PlayerDisplayConfig>({
    showNames: true,
    showNumbers: true,
    showStats: false,
    showStamina: true,
    showMorale: true,
    showAvailability: true,
    iconType: 'circle',
    namePosition: 'below',
    size: 'medium'
  });

  // Sample data initialization
  useEffect(() => {
    // Only initialize sample data if no current data exists
    if (!currentPlayers.length && !currentFormation) {
      const sampleData = initializeSampleData();
      
      // Dispatch sample players
      dispatch({
        type: 'SET_PLAYERS',
        payload: sampleData.players
      });
      
      // Dispatch sample formation
      dispatch({
        type: 'SET_FORMATION',
        payload: sampleData.formation
      });
    }
  }, [currentPlayers.length, currentFormation, dispatch]);

  // Calculate bench players
  const benchPlayers = useMemo(() => {
    if (currentFormation) {
      return getBenchPlayers(currentPlayers, currentFormation);
    }
    return [];
  }, [currentPlayers, currentFormation]);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isFormationStrengthVisible, setIsFormationStrengthVisible] = useState(false);
  const [showAIIntelligence, setShowAIIntelligence] = useState(false);
  const [isAIMinimized, setIsAIMinimized] = useState(false);

  // Performance optimizations
  const fieldRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef(Date.now());
  const batchedUpdates = useRef<Array<() => void>>([]);
  
  // Performance-aware configuration with mobile optimizations
  const optimizedConfig = useFastMemo(() => {
    const config = getOptimizedConfig();
    return {
      ...config,
      enableHeavyAnimations: !isLowPower && !mobileOptimizations.shouldReduceAnimations && config.enableAnimations,
      enableParticleEffects: !isLowPower && !isMobile && !mobileOptimizations.reducedEffects,
      animationDuration: mobileOptimizations.shouldReduceAnimations ? 0 : mobileOptimizations.animationDuration,
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
    (a, b) => a === b
  );
  
  // Enable virtualization for large player sets
  const shouldVirtualize = playerCount > 50;
  
  // Intersection observer for viewport optimizations
  const [containerRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Responsive sidebar management with mobile viewport considerations
  useEffect(() => {
    if (isMobile) {
      setShowLeftSidebar(false);
      setShowRightSidebar(false);
    } else if (isTablet) {
      setShowLeftSidebar(true);
      setShowRightSidebar(false);
    } else {
      setShowLeftSidebar(true);
      setShowRightSidebar(true);
    }
  }, [isMobile, isTablet]);

  // Mobile-specific optimizations
  useEffect(() => {
    if (isMobile && mobileCapabilities.hasHapticFeedback) {
      // Enable haptic feedback for mobile interactions
      document.addEventListener('touchstart', () => {
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }, { passive: true });
    }
  }, [isMobile, mobileCapabilities.hasHapticFeedback]);

  // Ultra-optimized player movement with intelligent batching and Web Workers
  const formationWorker = useRef<FormationWebWorker | null>(null);
  
  useEffect(() => {
    formationWorker.current = new FormationWebWorker();
    return () => formationWorker.current?.terminate();
  }, []);
  
  const handlePlayerMove = useThrottleCallback(async (playerId: string, position: { x: number; y: number }) => {
    // Immediate visual feedback for sub-16ms response
    startTransition(() => {
      batchedUpdates.current.push(() => {
        dispatch({
          type: 'UPDATE_PLAYER_POSITION_OPTIMISTIC',
          payload: { playerId, position },
        });
      });
    });
    
    // Heavy calculations in Web Worker
    if (shouldVirtualize && formationWorker.current) {
      try {
        const validationResult = await formationWorker.current.validatePlayerPosition({
          playerId,
          position,
          formation: currentFormation,
          players: currentPlayers
        });
        
        if (validationResult.isValid) {
          startTransition(() => {
            dispatch({
              type: 'UPDATE_PLAYER_POSITION',
              payload: { playerId, position: validationResult.optimizedPosition || position },
            });
          });
        }
      } catch (error) {
        console.warn('Worker validation failed, falling back to sync:', error);
        // Fallback to synchronous update
        dispatch({
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
  }, 8); // Increased to 120fps for ultra-responsive feel

  // Simple formation change handler
  const handleFormationChange = useCallback((formation: Formation) => {
    dispatch({
      type: 'UPDATE_FORMATION',
      payload: formation,
    });
  }, [dispatch]);

  // Player selection handler
  const handlePlayerSelect = useCallback((player: Player, position?: { x: number; y: number }) => {
    setSelectedPlayer(player);
    if (isMobile) {
      setRightPanelState('expanded');
    }
    
    // Show expanded card if position provided (for right-click/long-press)
    if (position) {
      setExpandedPlayerPosition(position);
      setShowExpandedPlayerCard(true);
    }
  }, [isMobile]);

  // Enhanced player move with conflict resolution
  const handlePlayerMoveWithConflict = useThrottleCallback((playerId: string, position: { x: number; y: number }, targetPlayerId?: string) => {
    // If there's a conflict with another player
    if (targetPlayerId && targetPlayerId !== playerId) {
      const sourcePlayer = currentPlayers.find(p => p.id === playerId);
      const targetPlayer = currentPlayers.find(p => p.id === targetPlayerId);
      
      if (sourcePlayer && targetPlayer) {
        setConflictData({
          sourcePlayer,
          targetPlayer,
          position
        });
        setShowConflictMenu(true);
        return;
      }
    }
    
    // No conflict - proceed with normal move
    handlePlayerMove(playerId, position);
  }, 16);

  // Conflict resolution handler
  const handleConflictResolve = useCallback((action: 'swap' | 'replace' | 'cancel' | 'find_alternative') => {
    if (!conflictData) return;
    
    const { sourcePlayer, targetPlayer, position } = conflictData;
    
    switch (action) {
      case 'swap':
        // Swap positions
        dispatch({
          type: 'SWAP_PLAYERS',
          payload: {
            playerId1: sourcePlayer.id,
            playerId2: targetPlayer.id
          }
        });
        break;
        
      case 'replace':
        // Move target to bench and place source
        dispatch({
          type: 'MOVE_TO_BENCH',
          payload: { playerId: targetPlayer.id }
        });
        handlePlayerMove(sourcePlayer.id, position);
        break;
        
      case 'find_alternative':
        // This would trigger alternative position finding logic
        // For now, we'll just show a message
        console.log('Finding alternative position for', targetPlayer.name);
        break;
        
      case 'cancel':
      default:
        // Do nothing - return to previous position
        break;
    }
    
    setShowConflictMenu(false);
    setConflictData(null);
  }, [conflictData, dispatch, handlePlayerMove]);

  // Player action handler (from expanded card)
  const handlePlayerAction = useCallback((action: 'swap' | 'bench' | 'instructions' | 'stats') => {
    if (!selectedPlayer) return;
    
    switch (action) {
      case 'swap':
        // Enter swap mode - could set a flag and change cursor
        console.log('Entering swap mode for', selectedPlayer.name);
        break;
        
      case 'bench':
        dispatch({
          type: 'MOVE_TO_BENCH',
          payload: { playerId: selectedPlayer.id }
        });
        break;
        
      case 'instructions':
        // Open tactical instructions
        console.log('Opening instructions for', selectedPlayer.name);
        break;
        
      case 'stats':
        // Open detailed stats view
        setShowPlayerStats(true);
        break;
    }
    
    setShowExpandedPlayerCard(false);
  }, [selectedPlayer, dispatch]);

  // Drawing state from UI context
  const { drawingTool, drawingColor, drawings } = uiState;
  
  // Drawing handlers
  const handleToolChange = useCallback((tool: DrawingTool) => {
    dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
  }, [dispatch]);
  
  const handleColorChange = useCallback((color: string) => {
    dispatch({ type: 'SET_DRAWING_COLOR', payload: color });
  }, [dispatch]);
  
  const handleAddDrawing = useCallback((shape: DrawingShape) => {
    dispatch({ type: 'ADD_DRAWING', payload: shape });
  }, [dispatch]);
  
  const handleUndoDrawing = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_DRAWING' });
  }, [dispatch]);
  
  const handleClearDrawings = useCallback(() => {
    if (confirm('Are you sure you want to clear all drawings?')) {
      dispatch({ type: 'CLEAR_DRAWINGS' });
    }
  }, [dispatch]);
  
  const handleGridToggle = useCallback(() => {
    setIsGridVisible(prev => !prev);
  }, []);
  
  const handleFormationStrengthToggle = useCallback(() => {
    setIsFormationStrengthVisible(prev => !prev);
  }, []);

  // Sidebar toggle functions
  const toggleLeftSidebar = useCallback(() => {
    setShowLeftSidebar(prev => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setShowRightSidebar(prev => !prev);
  }, []);

  // Dugout management handlers
  const handleSubstitution = useCallback((playerOut: string, playerIn: string) => {
    // Handle substitution logic here
    console.log(`Substituting ${playerOut} with ${playerIn}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleTacticalChange = useCallback((adjustment: any) => {
    // Handle tactical adjustment
    console.log('Tactical adjustment:', adjustment);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handlePlayerInstruction = useCallback((playerId: string, instruction: string) => {
    // Handle individual player instruction
    console.log(`Player ${playerId} instruction: ${instruction}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Challenge management handlers
  const handleChallengeStart = useCallback((challengeId: string) => {
    console.log(`Starting challenge: ${challengeId}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleChallengeComplete = useCallback((challengeId: string, score: number) => {
    console.log(`Challenge ${challengeId} completed with score: ${score}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Collaboration handlers
  const handleShareSession = useCallback((visibility: 'public' | 'private' | 'team') => {
    console.log(`Sharing session with visibility: ${visibility}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleInviteCollaborator = useCallback((email: string, role: 'editor' | 'viewer') => {
    console.log(`Inviting ${email} as ${role}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleAddComment = useCallback((position: { x: number; y: number }, content: string) => {
    console.log(`Adding comment at ${position.x}, ${position.y}: ${content}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleResolveComment = useCallback((commentId: string) => {
    console.log(`Resolving comment: ${commentId}`);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleUpdatePermissions = useCallback((collaboratorId: string, permissions: any) => {
    console.log(`Updating permissions for ${collaboratorId}:`, permissions);
    // You could dispatch to tactics context or call a prop function
  }, []);

  // Export/Import handlers
  const handleExportData = useCallback((options: any, data: any) => {
    console.log('Exporting data with options:', options);
    console.log('Export data:', data);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleImportData = useCallback((data: any, options: any) => {
    console.log('Importing data:', data);
    console.log('Import options:', options);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleSaveToLibrary = useCallback((library: any) => {
    console.log('Saving to library:', library);
    // You could dispatch to tactics context or call a prop function
  }, []);

  const handleLoadFromLibrary = useCallback((libraryId: string) => {
    console.log('Loading from library:', libraryId);
    // You could dispatch to tactics context or call a prop function
  }, []);

  // AI Intelligence handlers
  const handlePlayerAssignmentSuggestion = useCallback((assignments: any) => {
    console.log('Applying AI player assignments:', assignments);
    // Apply optimized assignments to formation
    assignments.assignments.forEach((assignment: any) => {
      dispatch({
        type: 'ASSIGN_PLAYER_TO_SLOT',
        payload: {
          slotId: assignment.slotId,
          playerId: assignment.playerId,
          team: 'home' // Adjust based on current team context
        }
      });
    });
  }, [dispatch]);

  const handleTacticalSuggestion = useCallback((suggestion: string) => {
    console.log('AI Tactical Suggestion:', suggestion);
    // Could show notification or update UI with suggestion
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `AI Suggestion: ${suggestion}`,
        type: 'info',
        duration: 5000
      }
    });
  }, [dispatch]);

  const handleDrawingSuggestion = useCallback((suggestion: any) => {
    console.log('AI Drawing Suggestion:', suggestion);
    // Could automatically add suggested drawing or show as suggestion
    const drawingShape = {
      id: Date.now().toString(),
      tool: suggestion.tool,
      color: '#3b82f6',
      points: suggestion.suggestedPositions || [],
      timestamp: Date.now()
    };
    
    dispatch({
      type: 'ADD_DRAWING',
      payload: drawingShape
    });
  }, [dispatch]);

  // View mode handlers
  const enterFullscreen = useCallback(() => {
    setViewMode('fullscreen');
    if (fieldRef.current?.requestFullscreen) {
      fieldRef.current.requestFullscreen();
    }
  }, []);

  // Presentation mode handlers
  const togglePresentationMode = useCallback(() => {
    setIsPresenting(prev => !prev);
    if (!isPresenting) {
      setViewMode('presentation');
      dispatch({ type: 'ENTER_PRESENTATION_MODE' });
    } else {
      setViewMode('standard');
      dispatch({ type: 'EXIT_PRESENTATION_MODE' });
    }
  }, [isPresenting, dispatch]);

  const exitFullscreen = useCallback(() => {
    setViewMode('standard');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  // Quick action handlers
  const quickActions = useMemo(() => [
    {
      id: 'formations',
      icon: Users,
      label: 'Formations',
      action: () => setShowFormationTemplates(true),
      isActive: showFormationTemplates,
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
      action: () => setShowAIAnalysis(!showAIAnalysis),
      isActive: showAIAnalysis,
    },
    {
      id: 'ai-intelligence',
      icon: Zap,
      label: 'AI Intelligence',
      action: () => setShowAIIntelligence(!showAIIntelligence),
      isActive: showAIIntelligence,
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
      action: () => setShowTacticalPlaybook(true),
      isActive: showTacticalPlaybook,
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
      action: () => setShowAIAssistant(true),
      isActive: showAIAssistant,
    },
    {
      id: 'heatmap',
      icon: Activity,
      label: 'Heat Map',
      action: () => setShowHeatMap(!showHeatMap),
      isActive: showHeatMap,
    },
    {
      id: 'chemistry',
      icon: Heart,
      label: 'Player Chemistry',
      action: () => setShowChemistry(!showChemistry),
      isActive: showChemistry,
    },
    {
      id: 'player-stats',
      icon: Eye,
      label: 'Player Stats',
      action: () => setShowPlayerStats(!showPlayerStats),
      isActive: showPlayerStats,
    },
    {
      id: 'analysis',
      icon: Zap,
      label: 'Live Analysis',
      action: () => setShowAnalyticsPanel(true),
      isActive: showAnalyticsPanel,
    },
    {
      id: 'dugout',
      icon: Users2,
      label: 'Dugout Management',
      action: () => setShowDugoutManagement(true),
      isActive: showDugoutManagement,
    },
    {
      id: 'challenges',
      icon: Trophy,
      label: 'Challenge Center',
      action: () => setShowChallengeManagement(true),
      isActive: showChallengeManagement,
    },
    {
      id: 'collaboration',
      icon: Users,
      label: 'Collaborate',
      action: () => setShowCollaboration(true),
      isActive: showCollaboration,
    },
    {
      id: 'export-import',
      icon: Archive,
      label: 'Export & Import',
      action: () => setShowExportImport(true),
      isActive: showExportImport,
    },
    {
      id: 'fullscreen',
      icon: viewMode === 'fullscreen' ? Minimize2 : Maximize2,
      label: viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen',
      action: viewMode === 'fullscreen' ? exitFullscreen : enterFullscreen,
    },
  ], [
    showFormationTemplates,
    showAIAssistant,
    showTacticalPlaybook,
    showAnalyticsPanel,
    showHeatMap,
    showChemistry,
    showPlayerStats,
    showDugoutManagement,
    showChallengeManagement,
    showCollaboration,
    showExportImport,
    viewMode,
    currentFormation,
    onSimulateMatch,
    onAnalyticsView,
    onSaveFormation,
    onExportFormation,
    dispatch,
    enterFullscreen,
    exitFullscreen,
  ]);

  // Layout calculations
  const layoutClasses = useMemo(() => {
    return {
      container: viewMode === 'fullscreen' ? 'fixed inset-0 z-50' : 'h-full',
      leftSidebar: 'w-80 flex-shrink-0',
      rightSidebar: 'w-80 flex-shrink-0',
      mainArea: 'flex-1 min-w-0',
    };
  }, [viewMode]);

  return (
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
              initial={optimizedConfig.enableAnimations ? { x: -320, opacity: 0 } : false}
              animate={optimizedConfig.enableAnimations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
              exit={optimizedConfig.enableAnimations ? { x: -320, opacity: 0 } : { opacity: 0 }}
              transition={optimizedConfig.enableAnimations ? {
                duration: optimizedConfig.animationDuration / 1000,
                ease: "easeOut"
              } : { duration: 0 }}
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
              onPlayerMove={positioningMode === 'snap' ? handlePlayerMove : handlePlayerMoveWithConflict}
              onPlayerSelect={handlePlayerSelect}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              viewMode={viewMode}
              players={shouldVirtualize ? deferredPlayers : currentPlayers}
              showHeatMap={showHeatMap && optimizedConfig.enableParticleEffects && isIntersecting}
              showPlayerStats={showPlayerStats && isIntersecting}
              performanceMode={isLowPower || !isIntersecting}
              positioningMode={positioningMode}
              virtualizationEnabled={shouldVirtualize}
              renderOptimizations={{
                enableOcclusion: playerCount > 100,
                enableLOD: playerCount > 200,
                batchRendering: playerCount > 50,
                useCanvasRenderer: playerCount > 150
              }}
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
              showChemistry={showChemistry}
              viewMode={viewMode}
            />

            {/* Player Drag Layer */}
            <PlayerDragLayer
              isDragging={isDragging}
              currentPlayer={selectedPlayer}
            />

            {/* Conflict Resolution Menu */}
            {showConflictMenu && conflictData && (
              <ConflictResolutionMenu
                isVisible={showConflictMenu}
                position={conflictData.position}
                sourcePlayer={conflictData.sourcePlayer}
                targetPlayer={conflictData.targetPlayer}
                onResolve={handleConflictResolve}
                onClose={() => {
                  setShowConflictMenu(false);
                  setConflictData(null);
                }}
              />
            )}

            {/* Expanded Player Card */}
            {showExpandedPlayerCard && selectedPlayer && (
              <ExpandedPlayerCard
                player={selectedPlayer}
                isVisible={showExpandedPlayerCard}
                position={expandedPlayerPosition}
                onClose={() => setShowExpandedPlayerCard(false)}
                onPlayerAction={handlePlayerAction}
              />
            )}

            {/* Animation Timeline */}
            {uiState.activePlaybookItemId && uiState.activeStepIndex !== null && (
              <AnimationTimeline />
            )}
          </main>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence mode="wait">
          {showRightSidebar && (
            <motion.div
              initial={optimizedConfig.enableAnimations ? { x: 320, opacity: 0 } : false}
              animate={optimizedConfig.enableAnimations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
              exit={optimizedConfig.enableAnimations ? { x: 320, opacity: 0 } : { opacity: 0 }}
              transition={optimizedConfig.enableAnimations ? {
                duration: optimizedConfig.animationDuration / 1000,
                ease: "easeOut"
              } : { duration: 0 }}
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
        {showFormationTemplates && (
          <Suspense fallback={
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              aria-live="polite"
              aria-label="Loading formation templates"
            >
              <div className="bg-slate-900/95 rounded-xl p-8 text-white">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <div>Loading Formation Templates...</div>
              </div>
            </div>
          }>
            <FormationTemplates
              onSelect={handleFormationChange}
              onClose={() => setShowFormationTemplates(false)}
            />
          </Suspense>
        )}

        {showAIAssistant && (
          <Suspense fallback={
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              aria-live="polite"
              aria-label="Loading AI assistant"
            >
              <div className="bg-slate-900/95 rounded-xl p-8 text-white">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <div>Loading AI Assistant...</div>
              </div>
            </div>
          }>
            <IntelligentAssistant
              currentFormation={currentFormation}
              selectedPlayer={selectedPlayer}
              onFormationChange={handleFormationChange}
              onPlayerSelect={handlePlayerSelect}
              onClose={() => setShowAIAssistant(false)}
              players={currentPlayers}
            />
          </Suspense>
        )}

        {showTacticalPlaybook && (
          <Suspense fallback={
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              aria-live="polite"
              aria-label="Loading tactical playbook"
            >
              <div className="bg-slate-900/95 rounded-xl p-8 text-white">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <div>Loading Tactical Playbook...</div>
              </div>
            </div>
          }>
            <TacticalPlaybook
              currentFormation={currentFormation}
              currentPlayers={currentPlayers}
              onLoadFormation={handleFormationChange}
              onClose={() => setShowTacticalPlaybook(false)}
              isOpen={showTacticalPlaybook}
            />
          </Suspense>
        )}

        {showAnalyticsPanel && (
          <Suspense fallback={
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              aria-live="polite"
              aria-label="Loading tactical analytics"
            >
              <div className="bg-slate-900/95 rounded-xl p-8 text-white">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <div>Loading Tactical Analytics...</div>
              </div>
            </div>
          }>
            <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm">
              <div className="fixed inset-4 z-31 overflow-auto">
                <AdvancedAnalyticsDashboard
                  players={currentPlayers}
                  onClose={() => setShowAnalyticsPanel(false)}
                  className="h-full"
                />
              </div>
            </div>
          </Suspense>
        )}

        {showAIAnalysis && (
          <div className="fixed top-20 right-4 z-25 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg max-w-md">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">AI Tactical Analysis</span>
              </div>
              <button
                onClick={() => setShowAIAnalysis(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <div className="text-yellow-400">• Suggestion: Consider stronger midfield presence</div>
                </div>
                <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors">
                  Get Detailed Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {showDugoutManagement && (
          <DugoutManagement
            players={currentPlayers}
            formation={currentFormation}
            currentMinute={45} // This could come from match state
            substitutionsUsed={1} // This could come from match state
            maxSubstitutions={5}
            onSubstitution={handleSubstitution}
            onTacticalChange={handleTacticalChange}
            onPlayerInstruction={handlePlayerInstruction}
            isOpen={showDugoutManagement}
            onClose={() => setShowDugoutManagement(false)}
          />
        )}

        {showChallengeManagement && (
          <ChallengeManagement
            players={currentPlayers}
            formations={tacticsState?.formations || {}}
            completedChallenges={[]} // This would come from state
            onChallengeStart={handleChallengeStart}
            onChallengeComplete={handleChallengeComplete}
            isOpen={showChallengeManagement}
            onClose={() => setShowChallengeManagement(false)}
          />
        )}

        {showCollaboration && (
          <CollaborationFeatures
            formation={currentFormation}
            players={currentPlayers}
            currentUser={{ id: 'user-1', name: 'Head Coach', role: 'coach' }} // This would come from auth state
            onShareSession={handleShareSession}
            onInviteCollaborator={handleInviteCollaborator}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onUpdatePermissions={handleUpdatePermissions}
            isOpen={showCollaboration}
            onClose={() => setShowCollaboration(false)}
          />
        )}

        {showExportImport && (
          <EnhancedExportImport
            formations={tacticsState?.formations || {}}
            playbook={tacticsState?.playbook || {}}
            players={currentPlayers}
            onExport={handleExportData}
            onImport={handleImportData}
            onSaveToLibrary={handleSaveToLibrary}
            onLoadFromLibrary={handleLoadFromLibrary}
            isOpen={showExportImport}
            onClose={() => setShowExportImport(false)}
          />
        )}

        {/* AI Tactical Intelligence */}
        {showAIIntelligence && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-4 z-40 w-96 max-h-[calc(100vh-6rem)]"
          >
            <AITacticalIntelligence
              formation={currentFormation}
              players={currentPlayers}
              drawings={tacticsState?.drawings || []}
              team="home"
              isMinimized={isAIMinimized}
              onMinimizeToggle={() => setIsAIMinimized(!isAIMinimized)}
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
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { message, type }
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
        onPositioningModeToggle={() => setPositioningMode(prev => prev === 'snap' ? 'free' : 'snap')}
        onGridToggle={handleGridToggle}
        onFormationStrengthToggle={handleFormationStrengthToggle}
        isAnimating={uiState.isAnimating || false}
        canPlayAnimation={!!(uiState.activePlaybookItemId && tacticsState?.playbook?.[uiState.activePlaybookItemId]?.steps?.length > 1)}
        onPlayAnimation={() => dispatch({ type: 'START_ANIMATION' })}
        onResetAnimation={() => dispatch({ type: 'RESET_ANIMATION' })}
        viewMode={viewMode}
        onToggleFullscreen={viewMode === 'fullscreen' ? exitFullscreen : enterFullscreen}
        playerDisplayConfig={playerDisplayConfig}
        onPlayerDisplayConfigChange={setPlayerDisplayConfig}
      />
    </div>
  );
};

export { UnifiedTacticsBoard };
export default React.memo(UnifiedTacticsBoard);