import React, { useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIContext, useTacticsContext, useResponsive, useResponsiveModal } from '../hooks';
import { Header } from './ui/Header';
import NotificationContainer from './ui/NotificationContainer';
import PrintableLineup from './export/PrintableLineup';
import { toPng } from 'html-to-image';
import type { DrawingTool, ModalType } from '../types';

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

const MODAL_MAP: Record<ModalType, React.LazyExoticComponent<ComponentType<any>>> = {
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
    const { shouldUseFullScreenModal, modalSize } = useResponsiveModal();
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
            if (target?.closest('input, textarea, select')) return;

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
                t: 'text' 
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
            if (!isExportingLineup || !lineupRef?.current) return;
            try {
                const dataUrl = await toPng(lineupRef.current, { 
                    cacheBust: true, 
                    backgroundColor: (theme ?? 'dark') === 'light' ? '#f1f5f9' : '#1e293b' 
                });
                const link = document.createElement('a');
                link.download = 'astral-turf-tactic-sheet.png';
                link.href = dataUrl;
                link.click();
                dispatch({ type: 'ADD_NOTIFICATION', payload: { 
                    message: 'Tactic Sheet exported successfully!', 
                    type: 'success' 
                }});
            } catch (error) {
                console.error('Failed to export tactic sheet:', error);
                dispatch({ type: 'ADD_NOTIFICATION', payload: { 
                    message: 'An error occurred while exporting.', 
                    type: 'error' 
                }});
            } finally {
                dispatch({ type: 'EXPORT_LINEUP_FINISH' });
            }
        };
        exportLineup();
    }, [isExportingLineup, dispatch, theme, players, formations, activeFormationIds, captainIds]);

    const ActiveModalComponent = activeModal ? MODAL_MAP?.[activeModal] : null;

    return (
        <div className={`
            mobile-full-height mobile-safe-area
            flex flex-col w-screen 
            bg-[var(--bg-primary)] text-[var(--text-primary)] 
            overflow-hidden font-sans transition-colors duration-300 
            ${theme}
            ${isMobile ? 'mobile-layout' : isTablet ? 'tablet-layout' : 'desktop-layout'}
        `}>
            {/* Mobile-Responsive Header */}
            {!isPresentationMode && <Header />}
            
            {/* Mobile-First Main Content Area */}
            <main className={`
                flex-grow flex 
                ${isMobile ? 'flex-col' : 'flex-row'} 
                overflow-hidden relative
                ${currentBreakpoint === 'mobile' ? 'mobile-main' : ''}
            `}>
                {children ? children : <Outlet />}
            </main>
            
            {/* Footer (mobile-friendly) */}
            <footer className="sr-only">
                {/* Footer content can be added here if needed */}
            </footer>
            
            {/* Mobile-First Modal Rendering */}
            {ActiveModalComponent && (
                <Suspense fallback={
                    <div className={`
                        fixed inset-0 z-50
                        ${isMobile ? 'bg-[var(--bg-primary)]' : 'bg-black bg-opacity-50'} 
                        flex items-center justify-center
                        ${isMobile ? 'mobile-p-3' : 'p-4'}
                    `}>
                        <div className={`
                            ${isMobile ? 'w-full' : 'bg-white dark:bg-gray-800 p-4 rounded-lg'}
                            ${isMobile ? 'text-center' : ''}
                        `}>
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                            {!isMobile && <div className="mt-2 text-sm">Loading...</div>}
                        </div>
                    </div>
                }>
                    <div className={`
                        ${shouldUseFullScreenModal ? 'mobile-modal' : ''}
                        ${activeModal ? 'open' : ''}
                        ${isMobile ? 'mobile-safe-area' : ''}
                    `}>
                        <ActiveModalComponent />
                    </div>
                </Suspense>
            )}
            
            {/* Mobile-Optimized Global Notifications */}
            <NotificationContainer />
            
            {/* Mobile-Friendly Interactive Tutorial */}
            {uiState?.tutorial?.isActive && <InteractiveTutorialPopup />}
            
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
        </div>
    );
};

export default Layout;