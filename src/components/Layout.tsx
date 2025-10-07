import React, { useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIContext, useTacticsContext, useResponsive, useResponsiveModal } from '../hooks';
import { Header } from './ui/Header';
import NotificationContainer from './ui/NotificationContainer';
import PrintableLineup from './export/PrintableLineup';
import { toPng } from 'html-to-image';
import { cn } from '../utils/cn';
import type { DrawingTool, ModalType } from '../types';
// MobileAppLayout not needed - using ResponsivePage wrapper on individual pages

// Import design system CSS
import '../styles/design-system.css';

// Lazy load MODAL components (not pages)
const PlayerEditPopup = lazy(() => import('./popups/PlayerEditPopup'));
const PlayerComparePopup = lazy(() => import('./popups/PlayerComparePopup'));
const SlotActionMenu = lazy(() => import('./popups/SlotActionMenu'));
const AIChatPopup = lazy(() => import('./popups/AIChatPopup'));
const CustomFormationEditorPopup = lazy(() => import('./popups/CustomFormationEditorPopup'));
const LoadProjectPopup = lazy(() => import('./popups/LoadProjectPopup'));
const MatchSimulatorPopup = lazy(() => import('./popups/MatchSimulatorPopup'));
const PostMatchReportPopup = lazy(() => import('./popups/PostMatchReportPopup'));
const ContractNegotiationPopup = lazy(() => import('./popups/ContractNegotiationPopup'));
const AISubstitutionSuggestionPopup = lazy(() => import('./popups/AISubstitutionSuggestionPopup'));
const PlayerConversationPopup = lazy(() => import('./popups/PlayerConversationPopup'));
const InteractiveTutorialPopup = lazy(() => import('./popups/InteractiveTutorialPopup'));
const ScoutingPopup = lazy(() => import('./popups/ScoutingPopup'));
const TeamTalkPopup = lazy(() => import('./popups/TeamTalkPopup'));
const SeasonEndSummaryPopup = lazy(() => import('./popups/SeasonEndSummaryPopup'));
const PlaybookLibraryPopup = lazy(() => import('./popups/PlaybookLibraryPopup'));
const PressConferencePopup = lazy(() => import('./popups/PressConferencePopup'));

const MODAL_MAP: Record<
  ModalType,
  React.LazyExoticComponent<ComponentType<Record<string, unknown>>>
> = {
  editPlayer: PlayerEditPopup,
  comparePlayer: PlayerComparePopup,
  slotActionMenu: SlotActionMenu,
  chat: AIChatPopup,
  customFormationEditor: CustomFormationEditorPopup,
  loadProject: LoadProjectPopup,
  matchSimulator: MatchSimulatorPopup,
  postMatchReport: PostMatchReportPopup,
  contractNegotiation: ContractNegotiationPopup,
  pressConference: PressConferencePopup,
  aiSubSuggestion: AISubstitutionSuggestionPopup,
  playerConversation: PlayerConversationPopup,
  interactiveTutorial: InteractiveTutorialPopup,
  scouting: ScoutingPopup,
  sponsorships: lazy(() => import('../pages/SponsorshipsPage')), // Also a modal-like page
  teamTalk: TeamTalkPopup,
  seasonEndSummary: SeasonEndSummaryPopup,
  playbookLibrary: PlaybookLibraryPopup,
};

interface LayoutProps {
  children?: React.ReactNode;
}

/**
 * Main Layout component that wraps the application content
 * Provides header, main content area, modals, and global functionality
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const responsive = useResponsive();
  const { shouldUseFullScreenModal } = useResponsiveModal();
  const lineupRef = useRef<HTMLDivElement>(null);
  const { theme, isExportingLineup, isPresentationMode, activeModal } = uiState;
  const { players, formations, activeFormationIds, captainIds } = tacticsState;
  const { isMobile, isTablet, currentBreakpoint } = responsive;

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e?.target as HTMLElement;
      if (target?.closest && target?.closest('input, textarea, select')) {
        return;
      }

      // Ctrl/Cmd + R for soft reset
      if ((e?.ctrlKey || e?.metaKey) && e?.key?.toLowerCase() === 'r') {
        e?.preventDefault();
        dispatch({ type: 'SOFT_RESET_APP' });
        return;
      }

      // Drawing tool shortcuts
      const keyMap: Record<string, DrawingTool> = {
        v: 'select',
        a: 'arrow',
        l: 'line',
        r: 'zone',
        p: 'pen',
        t: 'text',
      };
      const tool = keyMap[e?.key?.toLowerCase() ?? ''];
      if (tool && !isPresentationMode) {
        e?.preventDefault();
        dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isPresentationMode]);

  // Handle lineup export
  useEffect(() => {
    const exportLineup = async () => {
      if (!isExportingLineup || !lineupRef?.current) {
        return;
      }
      try {
        const dataUrl = await toPng(lineupRef.current, {
          cacheBust: true,
          backgroundColor: (theme ?? 'dark') === 'light' ? '#f1f5f9' : '#1e293b',
        });
        const link = document.createElement('a');
        link.download = 'astral-turf-tactic-sheet.png';
        link.href = dataUrl;
        link.click();
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: 'Tactic Sheet exported successfully!',
            type: 'success',
          },
        });
      } catch {
        // Error logged to user notification instead
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            message: 'An error occurred while exporting.',
            type: 'error',
          },
        });
      } finally {
        dispatch({ type: 'EXPORT_LINEUP_FINISH' });
      }
    };
    exportLineup();
  }, [isExportingLineup, dispatch, theme, players, formations, activeFormationIds, captainIds]);

  const ActiveModalComponent = activeModal ? MODAL_MAP?.[activeModal] : null;

  // Main content to render
  const mainContent = (
    <div
      className={cn(
        // Base layout styles
        'mobile-full-height mobile-safe-area',
        'flex flex-col w-screen min-h-screen',
        'bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950',
        'text-white font-sans antialiased',
        'overflow-hidden transition-all duration-300',

        // Theme classes
        theme,

        // Responsive layout variants
        isMobile && 'mobile-layout',
        isTablet && 'tablet-layout',
        !isMobile && !isTablet && 'desktop-layout',
      )}
    >
      {/* Modern Header - Hide on mobile (MobileAppLayout provides its own header) */}
      {!isPresentationMode && !isMobile && (
        <div className="flex-shrink-0 z-40 relative">
          <Header />
        </div>
      )}

      {/* Enhanced Main Content Area */}
      <main
        className={cn(
          'flex-grow flex relative z-10',
          'bg-gradient-to-b from-secondary-950/50 via-transparent to-secondary-950/50',
          isMobile ? 'flex-col' : 'flex-row',
          'overflow-hidden',
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(20,184,166,0.03),transparent_90deg)]" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-grow flex flex-col w-full">
          {children ? children : <Outlet />}
        </div>
      </main>

      {/* Modern Modal System */}
      {ActiveModalComponent && (
        <Suspense
          fallback={
            <div
              className={cn(
                'fixed inset-0 z-80',
                'bg-black/60 backdrop-blur-sm',
                'flex items-center justify-center',
                'animate-fade-in',
                isMobile ? 'mobile-p-3' : 'p-6',
              )}
            >
              <div
                className={cn(
                  'card-elevated',
                  isMobile ? 'w-full max-h-[90vh]' : 'max-w-md',
                  'flex flex-col items-center justify-center p-8',
                  'animate-scale-in',
                )}
              >
                {/* Modern Loading Spinner */}
                <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                </div>
                {!isMobile && <p className="text-sm text-secondary-300 font-medium">Loading...</p>}
              </div>
            </div>
          }
        >
          <div
            className={cn(
              'fixed inset-0 z-80',
              'bg-black/60 backdrop-blur-sm',
              'animate-fade-in',
              shouldUseFullScreenModal && 'mobile-modal',
              activeModal && 'open',
              isMobile && 'mobile-safe-area',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center min-h-full',
                isMobile ? 'p-3' : 'p-6',
              )}
            >
              <div className="animate-scale-in">
                <ActiveModalComponent />
              </div>
            </div>
          </div>
        </Suspense>
      )}

      {/* Enhanced Notification System */}
      <div className="fixed top-0 right-0 z-90 p-4">
        <NotificationContainer />
      </div>

      {/* Interactive Tutorial */}
      {uiState?.tutorial?.isActive && (
        <div className="fixed inset-0 z-100">
          <InteractiveTutorialPopup />
        </div>
      )}

      {/* Hidden Export Component */}
      {isExportingLineup && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PrintableLineup
            ref={lineupRef}
            players={players}
            formations={formations}
            activeFormationIds={activeFormationIds}
            captainIds={captainIds}
          />
        </div>
      )}

      {/* Loading Overlay for Theme Transitions */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 transition-opacity duration-500" />
      </div>
    </div>
  );

  // Return main content directly - mobile responsiveness handled by ResponsivePage wrapper on individual pages
  return mainContent;
};

export default Layout;
