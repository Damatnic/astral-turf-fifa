import React, { useEffect, useRef, lazy, Suspense, ComponentType } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIContext, useTacticsContext } from '../hooks';
import { Header } from '../../components/ui/Header';
import NotificationContainer from '../../components/ui/NotificationContainer';
import PrintableLineup from '../../components/export/PrintableLineup';
import { toPng } from 'html-to-image';
import { DrawingTool, ModalType } from '../../types';

// Lazy load MODAL components (not pages)
const PlayerEditPopup = lazy(() => import('../../components/popups/PlayerEditPopup'));
const PlayerComparePopup = lazy(() => import('../../components/popups/PlayerComparePopup'));
const SlotActionMenu = lazy(() => import('../../components/popups/SlotActionMenu'));
const AIChatPopup = lazy(() => import('../../components/popups/AIChatPopup'));
const CustomFormationEditorPopup = lazy(() => import('../../components/popups/CustomFormationEditorPopup'));
const LoadProjectPopup = lazy(() => import('../../components/popups/LoadProjectPopup'));
const MatchSimulatorPopup = lazy(() => import('../../components/popups/MatchSimulatorPopup'));
const PostMatchReportPopup = lazy(() => import('../../components/popups/PostMatchReportPopup'));
const ContractNegotiationPopup = lazy(() => import('../../components/popups/ContractNegotiationPopup'));
const AISubstitutionSuggestionPopup = lazy(() => import('../../components/popups/AISubstitutionSuggestionPopup'));
const PlayerConversationPopup = lazy(() => import('../../components/popups/PlayerConversationPopup'));
const InteractiveTutorialPopup = lazy(() => import('../../components/popups/InteractiveTutorialPopup'));
const ScoutingPopup = lazy(() => import('../../components/popups/ScoutingPopup'));
const TeamTalkPopup = lazy(() => import('../../components/popups/TeamTalkPopup'));
const SeasonEndSummaryPopup = lazy(() => import('../../components/popups/SeasonEndSummaryPopup'));
const PlaybookLibraryPopup = lazy(() => import('../../components/popups/PlaybookLibraryPopup'));
const PressConferencePopup = lazy(() => import('../../components/popups/PressConferencePopup'));

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
    sponsorships: lazy(() => import('../../pages/SponsorshipsPage')), // Also a modal-like page
    teamTalk: TeamTalkPopup,
    seasonEndSummary: SeasonEndSummaryPopup,
    playbookLibrary: PlaybookLibraryPopup,
};

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main Layout component that wraps the application content
 * Provides header, main content area, modals, and global functionality
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState } = useTacticsContext();
    const lineupRef = useRef<HTMLDivElement>(null);
    const { theme, isExportingLineup, isPresentationMode, activeModal } = uiState;
    const { players, formations, activeFormationIds, captainIds } = tacticsState;
    
    // Handle theme changes
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('light', theme === 'light');
        root.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('input, textarea, select')) return;

            // Ctrl/Cmd + R for soft reset
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
                e.preventDefault();
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
            const tool = keyMap[e.key.toLowerCase()];
            if (tool && !isPresentationMode) {
                e.preventDefault();
                dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, isPresentationMode]);

    // Handle lineup export
    useEffect(() => {
        const exportLineup = async () => {
            if (!isExportingLineup || !lineupRef.current) return;
            try {
                const dataUrl = await toPng(lineupRef.current, { 
                    cacheBust: true, 
                    backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b' 
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

    const ActiveModalComponent = activeModal ? MODAL_MAP[activeModal] : null;

    return (
        <div className={`flex flex-col h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-300 ${theme}`}>
            {/* Header */}
            {!isPresentationMode && <Header />}
            
            {/* Main Content Area */}
            <main className="flex flex-grow overflow-hidden">
                {children ? children : <Outlet />}
            </main>
            
            {/* Footer (could be extended with additional footer content) */}
            <footer className="sr-only">
                {/* Footer content can be added here if needed */}
            </footer>
            
            {/* Modal Rendering */}
            {ActiveModalComponent && (
                <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">Loading...</div>
                </div>}>
                    <ActiveModalComponent />
                </Suspense>
            )}
            
            {/* Global Notifications */}
            <NotificationContainer />
            
            {/* Interactive Tutorial */}
            {uiState.tutorial?.isActive && <InteractiveTutorialPopup />}
            
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