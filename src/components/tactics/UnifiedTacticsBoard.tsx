import React, { useState, useCallback, useRef, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticsContext, useUIContext, useResponsive } from '../../hooks';
import { ModernField } from './ModernField';
import { QuickActionsPanel } from './QuickActionsPanel';
import { ContextualToolbar } from './ContextualToolbar';
import { SmartSidebar } from './SmartSidebar';
import { PlayerDragLayer } from './PlayerDragLayer';
import { type Player, type Formation } from '../../types';
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
  Eye
} from 'lucide-react';

// Lazy load heavy components for better performance
const IntelligentAssistant = lazy(() => import('./IntelligentAssistant'));
const FormationTemplates = lazy(() => import('./FormationTemplates'));
const TacticalPlaybook = lazy(() => import('./TacticalPlaybook'));
const TacticalAnalyticsPanel = lazy(() => import('./TacticalAnalyticsPanel'));

interface UnifiedTacticsBoardProps {
  className?: string;
  onSimulateMatch?: (formation: Formation) => void;
  onSaveFormation?: (formation: Formation) => void;
  onAnalyticsView?: () => void;
  onExportFormation?: (formation: Formation) => void;
}

type ViewMode = 'standard' | 'fullscreen' | 'presentation';
type PanelState = 'collapsed' | 'peek' | 'expanded';

const UnifiedTacticsBoard: React.FC<UnifiedTacticsBoardProps> = ({ 
  className,
  onSimulateMatch,
  onSaveFormation,
  onAnalyticsView,
  onExportFormation
}) => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { isMobile, isTablet } = useResponsive();

  // Core UI state
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [leftPanelState, setLeftPanelState] = useState<PanelState>(isMobile ? 'collapsed' : 'peek');
  const [rightPanelState, setRightPanelState] = useState<PanelState>(isMobile ? 'collapsed' : 'peek');
  const [showFormationTemplates, setShowFormationTemplates] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTacticalPlaybook, setShowTacticalPlaybook] = useState(false);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  
  // Performance optimizations
  const fieldRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Memoized formation data
  const currentFormation = useMemo(() => {
    return tacticsState?.formations?.[tacticsState?.activeFormationIds?.home];
  }, [tacticsState?.formations, tacticsState?.activeFormationIds?.home]);

  // Current players data
  const currentPlayers = useMemo(() => {
    return tacticsState?.players || [];
  }, [tacticsState?.players]);

  // Responsive panel management
  useEffect(() => {
    if (isMobile) {
      setLeftPanelState('collapsed');
      setRightPanelState('collapsed');
    } else if (isTablet) {
      setLeftPanelState('peek');
      setRightPanelState('collapsed');
    }
  }, [isMobile, isTablet]);

  // Enhanced player movement handler
  const handlePlayerMove = useCallback((playerId: string, position: { x: number; y: number }) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      dispatch({
        type: 'UPDATE_PLAYER_POSITION',
        payload: { playerId, position }
      });
    });
  }, [dispatch]);

  // Formation change handler
  const handleFormationChange = useCallback((formation: Formation) => {
    dispatch({
      type: 'UPDATE_FORMATION',
      payload: formation
    });
  }, [dispatch]);

  // Player selection handler
  const handlePlayerSelect = useCallback((player: Player) => {
    setSelectedPlayer(player);
    if (isMobile) {
      setRightPanelState('expanded');
    }
  }, [isMobile]);

  // Smart panel toggle
  const toggleLeftPanel = useCallback(() => {
    setLeftPanelState(prev => {
      if (prev === 'collapsed') return 'peek';
      if (prev === 'peek') return 'expanded';
      return 'collapsed';
    });
  }, []);

  const toggleRightPanel = useCallback(() => {
    setRightPanelState(prev => {
      if (prev === 'collapsed') return 'peek';
      if (prev === 'peek') return 'expanded';
      return 'collapsed';
    });
  }, []);

  // View mode handlers
  const enterFullscreen = useCallback(() => {
    setViewMode('fullscreen');
    if (fieldRef.current?.requestFullscreen) {
      fieldRef.current.requestFullscreen();
    }
  }, []);

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
      isActive: showFormationTemplates
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
      disabled: !currentFormation || !onSimulateMatch
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
      disabled: !onAnalyticsView
    },
    {
      id: 'playbook',
      icon: Save,
      label: 'Tactical Playbook',
      action: () => setShowTacticalPlaybook(true),
      isActive: showTacticalPlaybook
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
      disabled: !currentFormation || !onExportFormation
    },
    {
      id: 'ai-assistant',
      icon: Brain,
      label: 'AI Assistant',
      action: () => setShowAIAssistant(true),
      isActive: showAIAssistant
    },
    {
      id: 'heatmap',
      icon: Activity,
      label: 'Heat Map',
      action: () => setShowHeatMap(!showHeatMap),
      isActive: showHeatMap
    },
    {
      id: 'player-stats',
      icon: Eye,
      label: 'Player Stats',
      action: () => setShowPlayerStats(!showPlayerStats),
      isActive: showPlayerStats
    },
    {
      id: 'analysis',
      icon: Zap,
      label: 'Live Analysis',
      action: () => setShowAnalyticsPanel(true),
      isActive: showAnalyticsPanel
    },
    {
      id: 'fullscreen',
      icon: viewMode === 'fullscreen' ? Minimize2 : Maximize2,
      label: viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen',
      action: viewMode === 'fullscreen' ? exitFullscreen : enterFullscreen
    }
  ], [
    showFormationTemplates, 
    showAIAssistant, 
    showTacticalPlaybook,
    showAnalyticsPanel,
    showHeatMap,
    showPlayerStats,
    viewMode, 
    currentFormation,
    onSimulateMatch,
    onAnalyticsView,
    onSaveFormation,
    onExportFormation,
    dispatch, 
    enterFullscreen, 
    exitFullscreen
  ]);

  // Layout calculations
  const layoutClasses = useMemo(() => {
    const leftWidth = leftPanelState === 'expanded' ? 'w-80' : leftPanelState === 'peek' ? 'w-16' : 'w-0';
    const rightWidth = rightPanelState === 'expanded' ? 'w-80' : rightPanelState === 'peek' ? 'w-16' : 'w-0';
    
    return {
      leftPanel: `${leftWidth} transition-all duration-300 ease-out`,
      rightPanel: `${rightWidth} transition-all duration-300 ease-out`,
      mainArea: 'flex-1 min-w-0',
      container: viewMode === 'fullscreen' ? 'fixed inset-0 z-50' : 'h-full'
    };
  }, [leftPanelState, rightPanelState, viewMode]);

  return (
    <div 
      ref={fieldRef}
      className={`
        ${layoutClasses.container} 
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
        overflow-hidden
        ${className}
      `}
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
        {/* Smart Left Sidebar */}
        <AnimatePresence mode="wait">
          {leftPanelState !== 'collapsed' && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: leftPanelState === 'expanded' ? 320 : 64, 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-shrink-0 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-sm"
              aria-label="Left sidebar"
              role="complementary"
            >
              <SmartSidebar
                state={leftPanelState}
                onToggle={toggleLeftPanel}
                formation={currentFormation}
                selectedPlayer={selectedPlayer}
                onPlayerSelect={handlePlayerSelect}
                side="left"
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Tactics Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Contextual Toolbar */}
          <header role="banner">
            <ContextualToolbar
              selectedPlayer={selectedPlayer}
              currentFormation={currentFormation}
              onFormationChange={handleFormationChange}
              leftPanelState={leftPanelState}
              rightPanelState={rightPanelState}
              onToggleLeftPanel={toggleLeftPanel}
              onToggleRightPanel={toggleRightPanel}
              viewMode={viewMode}
            />
          </header>

          {/* Field Container */}
          <main 
            className="flex-1 relative overflow-hidden"
            role="main"
            aria-label="Tactical field workspace"
          >
            <ModernField
              formation={currentFormation}
              selectedPlayer={selectedPlayer}
              onPlayerMove={handlePlayerMove}
              onPlayerSelect={handlePlayerSelect}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              viewMode={viewMode}
              players={currentPlayers}
              showHeatMap={showHeatMap}
              showPlayerStats={showPlayerStats}
            />

            {/* Quick Actions Panel */}
            <nav 
              aria-label="Quick actions"
              role="navigation"
            >
              <QuickActionsPanel
                actions={quickActions}
                position={isMobile ? 'bottom-center' : 'bottom-right'}
              />
            </nav>

            {/* Player Drag Layer */}
            <PlayerDragLayer
              isDragging={isDragging}
              currentPlayer={selectedPlayer}
            />
          </main>
        </div>

        {/* Smart Right Panel */}
        <AnimatePresence mode="wait">
          {rightPanelState !== 'collapsed' && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: rightPanelState === 'expanded' ? 320 : 64, 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-shrink-0 border-l border-slate-700/50 bg-slate-900/80 backdrop-blur-sm"
              aria-label="Right sidebar"
              role="complementary"
            >
              <SmartSidebar
                state={rightPanelState}
                onToggle={toggleRightPanel}
                formation={currentFormation}
                selectedPlayer={selectedPlayer}
                onPlayerSelect={handlePlayerSelect}
                side="right"
              />
            </motion.aside>
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
            <TacticalAnalyticsPanel
              formation={currentFormation}
              players={currentPlayers}
              isOpen={showAnalyticsPanel}
              onClose={() => setShowAnalyticsPanel(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Screen Reader Only Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedPlayer && `Selected player: ${selectedPlayer.name}`}
        {isDragging && 'Dragging player'}
        {currentFormation && `Current formation: ${currentFormation.name}`}
      </div>
    </div>
  );
};

export { UnifiedTacticsBoard };
export default React.memo(UnifiedTacticsBoard);