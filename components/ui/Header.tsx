

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTacticsContext, useUIContext, useFranchiseContext, useAuthContext } from '../../hooks';
import { LogoIcon, ResetIcon, PresentationIcon, MoonIcon, SunIcon, PlayIcon, CogIcon, GridIcon } from './icons';
import { TeamView, MatchEvent, MatchResult, MatchCommentary } from '../../types';
import { FileMenu } from './menus/FileMenu';
import { FranchiseMenu } from './menus/FranchiseMenu';
import { simulateMatch } from '../../services/simulationService';

const TeamToggleButton: React.FC<{
    view: TeamView,
    activeContext: TeamView,
    onClick: (view: TeamView) => void,
    children: React.ReactNode,
    className: string,
}> = ({ view, activeContext, onClick, children, className}) => (
    <button
        onClick={() => onClick(view)}
        className={`px-3 py-1 rounded-md text-sm font-semibold transition-all duration-200 ${
            activeContext === view 
            ? `shadow-md text-white ${className}` 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
        {children}
    </button>
);

export const Header: React.FC = () => {
    const { tacticsState, dispatch } = useTacticsContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { franchiseState } = useFranchiseContext();
    const { dispatch: authDispatch } = useAuthContext();
    
    const { players, formations, activeFormationIds } = tacticsState;
    const { activeTeamContext, isSimulatingMatch, activePlaybookItemId } = uiState;
    const { gameWeek } = franchiseState;
    const location = useLocation();

    const handleTeamContextChange = (view: TeamView) => {
        uiDispatch({ type: 'SET_ACTIVE_TEAM_CONTEXT', payload: view });
    };
    
    const handlePresentationMode = () => {
        if (!activePlaybookItemId) {
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Select a play from the playbook to enter presentation mode.', type: 'info' } });
            return;
        }
        uiDispatch({ type: 'ENTER_PRESENTATION_MODE' });
    };
    
    const handleSimulateMatch = async () => {
        const homeFormation = formations[activeFormationIds.home];
        const awayFormation = formations[activeFormationIds.away];
        const homePlayerIds = new Set(homeFormation.slots.map(s => s.playerId).filter(Boolean));
        const awayPlayerIds = new Set(awayFormation.slots.map(s => s.playerId).filter(Boolean));
        
        if (homePlayerIds.size !== 11 || awayPlayerIds.size !== 11) {
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Both teams must have 11 players on the field to start a simulation.', type: 'error' } });
            return;
        }

        uiDispatch({ type: 'OPEN_MODAL', payload: 'matchSimulator' });
    }

    const isTacticsPage = location.pathname === '/tactics';

    const handleLogout = () => {
        authDispatch({ type: 'LOGOUT' });
    };

    return (
        <header className="flex-shrink-0 bg-[var(--bg-primary)] h-16 flex items-center justify-between px-4 border-b border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center space-x-2">
                <LogoIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <h1 className="text-xl font-bold tracking-wider text-[var(--text-primary)]">
                    <span className="text-[var(--accent-primary)]">Astral</span>Turf
                </h1>
                <FileMenu />
                <FranchiseMenu />
                 <Link
                    to="/tactics"
                    className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md"
                    title="Go to Tactics Board"
                    data-testid="header-tactics-button"
                >
                    <GridIcon className="w-4 h-4 mr-2" />
                    Tactics
                </Link>
                {isTacticsPage && (
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset the current tactic board? This will reset player positions and drawings.')) {
                                dispatch({ type: 'SOFT_RESET_APP' });
                            }
                        }}
                        className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md"
                        title="Reset tactic board"
                    >
                        <ResetIcon className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                )}
                 <button
                    onClick={() => {
                        dispatch({type: 'ADVANCE_WEEK'});
                        uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Advanced to Week ${gameWeek + 1}`, type: 'info' } });
                    }}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md"
                    title="Advance to next week"
                >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Advance Week
                </button>
            </div>
            
            {isTacticsPage && (
                <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg">
                    <TeamToggleButton view="home" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-blue-600">Home</TeamToggleButton>
                    <TeamToggleButton view="away" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-red-600">Away</TeamToggleButton>
                    <TeamToggleButton view="both" activeContext={activeTeamContext} onClick={handleTeamContextChange} className="bg-gray-600">Both</TeamToggleButton>
                </div>
            )}

            <div className="flex items-center space-x-2">
                {isTacticsPage && (
                    <>
                        <button onClick={handleSimulateMatch} disabled={isSimulatingMatch} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" title="Simulate Match">
                            <PlayIcon className="w-4 h-4 mr-2" />
                            {isSimulatingMatch ? 'Simulating...' : 'Simulate Match'}
                        </button>
                        <button onClick={handlePresentationMode} className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md" title="Presentation Mode">
                            <PresentationIcon className="w-4 h-4 mr-2" />
                            Present
                        </button>
                    </>
                )}
                <button onClick={() => uiDispatch({type: 'TOGGLE_THEME'})} className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md" title="Toggle Theme">
                    {uiState.theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                </button>
                 <Link to="/settings" className="flex items-center px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md" title="Settings">
                    <CogIcon className="w-5 h-5" />
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md">
                    Logout
                </button>
            </div>
        </header>
    );
};